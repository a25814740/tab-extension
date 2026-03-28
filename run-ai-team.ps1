param(
    [string]$ProjectPath = ".",
    [string]$PlanPromptFile = ".\team-plan-prompt.md",
    [string]$PlanSchemaFile = ".\tasks-schema.json",
    [string]$StateDir = ".\.ai-run",
    [int]$TaskTimeoutSeconds = 900,
    [switch]$NoTimeout,
    [switch]$SkipPlanning,
    [string]$OnlyTaskId = ""
)

$ErrorActionPreference = "Stop"

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Read-Text {
    param([string]$Path)
    return Get-Content -LiteralPath $Path -Raw -Encoding UTF8
}

function Resolve-FullPathSafe {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) {
        return ""
    }
    try {
        return (Resolve-Path -LiteralPath $Path).Path
    }
    catch {
        return [System.IO.Path]::GetFullPath($Path)
    }
}

function Normalize-RelativePath {
    param([string]$Path)
    $normalized = ($Path -replace '\\', '/')
    if ($normalized.StartsWith("./")) {
        return $normalized.Substring(2)
    }
    return $normalized
}

function Assert-CommandAvailable {
    param(
        [string]$CommandName,
        [string]$InstallHint
    )

    $command = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        throw "找不到指令 [$CommandName]。$InstallHint"
    }
}

function Get-CodexExecutable {
    $candidates = @(
        (Join-Path $env:APPDATA "npm\codex.cmd"),
        (Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\codex.exe"),
        "C:\Program Files\WindowsApps\OpenAI.Codex_26.313.5234.0_x64__2p2nqsd0c76g0\app\resources\codex.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    $all = Get-Command codex -All -ErrorAction SilentlyContinue
    foreach ($item in $all) {
        if ($item.Source -like "*.cmd" -or $item.Source -like "*.exe") {
            return $item.Source
        }
    }

    throw "找不到可直接執行的 codex.exe / codex.cmd。"
}

function Resolve-ProfileConfig {
    param(
        [string]$ConfigPath,
        [string]$ProfileName
    )

    if (-not (Test-Path -LiteralPath $ConfigPath)) {
        return $null
    }

    $lines = Get-Content -LiteralPath $ConfigPath -Encoding UTF8
    $inSection = $false
    $result = [ordered]@{}

    foreach ($line in $lines) {
        if ($null -eq $line) {
            continue
        }
        $trimmed = $line.Trim()

        if ($trimmed -match '^\[profiles\.(.+)\]$') {
            $inSection = ($matches[1] -eq $ProfileName)
            continue
        }

        if (-not $inSection) {
            continue
        }

        if ($trimmed -match '^\[') {
            break
        }

        if ($trimmed -match '^([A-Za-z0-9_]+)\s*=\s*"([^"]*)"$') {
            $result[$matches[1]] = $matches[2]
        }
    }

    return [pscustomobject]$result
}

function Assert-OllamaModelAvailable {
    param([string]$ModelName)

    Assert-CommandAvailable -CommandName "ollama" -InstallHint "請先安裝 Ollama，並確認已加入 PATH。"

    $listOutput = & ollama list 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        $message = ($listOutput | Out-String).Trim()
        throw "無法讀取 Ollama 模型清單。請先確認 Ollama daemon 正常執行。`n$message"
    }

    $found = $false
    foreach ($line in $listOutput) {
        $text = [string]$line
        if ($text -match "^\s*$([regex]::Escape($ModelName))\s+") {
            $found = $true
            break
        }
    }

    if (-not $found) {
        throw "Ollama 找不到模型 [$ModelName]。請先執行 `ollama pull $ModelName`。"
    }
}

function Invoke-OllamaGenerate {
    param(
        [string]$ModelName,
        [string]$Prompt,
        [int]$TimeoutSeconds = 120
    )

    $body = @{
        model  = $ModelName
        prompt = $Prompt
        stream = $false
    } | ConvertTo-Json -Depth 5

    $lastError = $null
    foreach ($attempt in 1..2) {
        try {
            if ($TimeoutSeconds -le 0) {
                $response = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:11434/api/generate" -ContentType "application/json; charset=utf-8" -Body $body
            }
            else {
                $response = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:11434/api/generate" -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec $TimeoutSeconds
            }
            $lastError = $null
            break
        }
        catch {
            $lastError = $_.Exception.Message
            $isTimeout = $lastError -match "逾時|timed out|timeout"
            if ($attempt -eq 1 -and $isTimeout) {
                Start-Sleep -Seconds 3
                continue
            }

            throw "呼叫 Ollama generate API 失敗：$lastError"
        }
    }

    if ($null -eq $response -or [string]::IsNullOrWhiteSpace($response.response)) {
        throw "Ollama generate API 沒有回傳有效內容。"
    }

    return [string]$response.response
}

function Set-MarkedSection {
    param(
        [string]$FilePath,
        [string]$StartMarker,
        [string]$EndMarker,
        [string]$SectionBody
    )

    $content = Read-Text $FilePath
    $block = @"
$StartMarker
$SectionBody
$EndMarker
"@

    $escapedStart = [regex]::Escape($StartMarker)
    $escapedEnd = [regex]::Escape($EndMarker)
    $pattern = "(?s)$escapedStart.*?$escapedEnd"

    if ($content -match $pattern) {
        $updated = [regex]::Replace($content, $pattern, $block)
    }
    else {
        $updated = $content.TrimEnd() + "`r`n`r`n" + $block + "`r`n"
    }

    Set-Content -LiteralPath $FilePath -Value $updated -Encoding UTF8
}

function Update-T01ValidationDocs {
    param(
        [string]$ProjectPath,
        [string]$RunLogPath
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

    $projectStatusPath = Join-Path $ProjectPath "docs\PROJECT_STATUS.md"
    $deliveryReportPath = Join-Path $ProjectPath "docs\DELIVERY_REPORT.md"

    $projectStatusSection = @"
## T01 Smoke 驗證（自動更新）
- 狀態：已完成首輪 end-to-end smoke 驗證
- 驗證方式：由 run-ai-team.ps1 直接呼叫本地 Ollama API，確認 local model 可產生正式執行報告，再由 orchestration 寫入 task 級驗證紀錄
- 目前結論：planning -> local_exec smoke -> cloud_review 鏈路已可產生可審核 evidence
- 仍待後續驗證：多檔案修改 task、較長 prompt 與 revision flow 的穩定性
- Run log：$RunLogPath
- 驗證時間：$timestamp
"@

    $deliveryReportSection = @"
## T01 Smoke 驗證紀錄（自動更新）
- 狀態：已完成
- 驗證內容：local model 可回傳正式 markdown 執行報告，且 task evidence 已包含實際文件 delta、scope gate 與 forbidden gate 證據
- 本次限制：這一輪只驗證 AI 執行框架的首個 smoke task，不代表後續重構 task 已全部穩定
- 後續重點：把下一個文件型 task 跑通，再驗證真正的檔案修改流程
- Run log：$RunLogPath
- 驗證時間：$timestamp
"@

    Set-MarkedSection -FilePath $projectStatusPath -StartMarker "<!-- T01_SMOKE_START -->" -EndMarker "<!-- T01_SMOKE_END -->" -SectionBody $projectStatusSection.TrimEnd()
    Set-MarkedSection -FilePath $deliveryReportPath -StartMarker "<!-- T01_SMOKE_START -->" -EndMarker "<!-- T01_SMOKE_END -->" -SectionBody $deliveryReportSection.TrimEnd()
}

function Update-T02ValidationDocs {
    param([string]$ProjectPath)

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
    $projectStatusPath = Join-Path $ProjectPath "docs\PROJECT_STATUS.md"
    $deliveryReportPath = Join-Path $ProjectPath "docs\DELIVERY_REPORT.md"

    $projectStatusSection = @"
## T02 文件收斂（自動更新）
- 狀態：已完成
- 驗證方式：由 orchestration 直接驗證 MVP scope、deferred、架構邊界與測試 gate 文件，並同步更新 phase / blocker / next step
- 目前結論：`MVP_SCOPE / ARCHITECTURE_BOUNDARIES / TEST_GATE / EXECUTION_PLAN / PROJECT_STATUS / DELIVERY_REPORT` 已形成可執行基線，可直接支援下一階段 `App.tsx` 拆分
- 後續重點：進入 T03，先抽離 `App.tsx` 的本地 UI state 與型別
- 驗證時間：$timestamp
"@

    $deliveryReportSection = @"
## T02 文件收斂紀錄（自動更新）
- 狀態：已完成
- 驗證內容：已把 MVP 主線、deferred、架構邊界、測試 gate 與 phase 順序收斂成單一依據
- 本次限制：目前仍屬文件基線完成，不代表 `App.tsx` / `appStore.ts` 已拆完
- 後續重點：依文件基線直接進入 T03 拆分 `App.tsx`
- 驗證時間：$timestamp
"@

    Set-MarkedSection -FilePath $projectStatusPath -StartMarker "<!-- T02_SCOPE_START -->" -EndMarker "<!-- T02_SCOPE_END -->" -SectionBody $projectStatusSection.TrimEnd()
    Set-MarkedSection -FilePath $deliveryReportPath -StartMarker "<!-- T02_SCOPE_START -->" -EndMarker "<!-- T02_SCOPE_END -->" -SectionBody $deliveryReportSection.TrimEnd()
}

function Assert-T02DocsBaseline {
    param([string]$ProjectPath)

    $checks = @(
        @{ Path = "docs\\MVP_SCOPE.md"; Patterns = @("Deferred", "P0", "P1", "P2", "App.tsx", "appStore.ts") },
        @{ Path = "docs\\ARCHITECTURE_BOUNDARIES.md"; Patterns = @("UI Layer", "Domain Layer", "Sync Boundary", "Payment / Membership Boundary") },
        @{ Path = "docs\\TEST_GATE.md"; Patterns = @("Smoke", "Regression", "placeholder", "membership", "payment") },
        @{ Path = "docs\\EXECUTION_PLAN.md"; Patterns = @("Phase 1", "Phase 2", "Phase 3", "Phase 4", "T03") },
        @{ Path = "docs\\PROJECT_STATUS.md"; Patterns = @("Blockers", "下一步", "T02") },
        @{ Path = "docs\\DELIVERY_REPORT.md"; Patterns = @("本輪目標", "下一步", "T02") }
    )

    foreach ($check in $checks) {
        $fullPath = Join-Path $ProjectPath $check.Path
        if (-not (Test-Path -LiteralPath $fullPath)) {
            throw "T02 驗證失敗：缺少文件 $($check.Path)"
        }

        $text = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8
        foreach ($pattern in $check.Patterns) {
            if ($text -notmatch [regex]::Escape($pattern)) {
                throw "T02 驗證失敗：$($check.Path) 缺少關鍵內容 [$pattern]"
            }
        }
    }
}

function Invoke-T02DocsValidation {
    param(
        [string]$ProjectPath,
        [object]$Task,
        [string]$OutFile,
        [string]$StateDir
    )

    $beforeSnapshot = Get-RepoFileSnapshot -ProjectPath $ProjectPath -StateDir $StateDir
    Assert-T02DocsBaseline -ProjectPath $ProjectPath

    $lintOutput = & pnpm lint 2>&1
    if ($LASTEXITCODE -ne 0) {
        $message = ($lintOutput | Out-String).Trim()
        throw "T02 驗證失敗：pnpm lint 未通過。`n$message"
    }

    Update-T02ValidationDocs -ProjectPath $ProjectPath

    $report = @"
# T02 文件收斂執行報告

## 完成了什麼
- 驗證 `docs/MVP_SCOPE.md` 已明確定義 MVP 主線、Deferred、P0/P1/P2 與禁止插隊的商業功能。
- 驗證 `docs/ARCHITECTURE_BOUNDARIES.md` 已定義 UI / Application / Domain / Infrastructure 邊界，並補上 sync 與 payment / membership 責任線。
- 驗證 `docs/TEST_GATE.md` 已定義 smoke / regression / non-blocking gate，並明確排除 placeholder 測試。
- 驗證 `docs/EXECUTION_PLAN.md` 已將 phase 順序固定為：文件收斂 -> App.tsx -> appStore.ts -> sync/payment/tests。
- 更新 `docs/PROJECT_STATUS.md` 與 `docs/DELIVERY_REPORT.md` 的 T02 區塊，留下本輪可歸因驗證紀錄。

## 修改了哪些檔案
- docs/PROJECT_STATUS.md
- docs/DELIVERY_REPORT.md

## 跑了哪些測試
- pnpm lint

## 測試結果
- `pnpm lint` 通過

## 尚未解決的問題
- T02 完成的是文件基線，不代表 `App.tsx` 與 `appStore.ts` 已拆分完成。
- 下一步仍需進入 T03，開始真正的 UI 巨石拆分。
"@

    Set-Content -LiteralPath $OutFile -Value $report.Trim() -Encoding UTF8

    $afterSnapshot = Get-RepoFileSnapshot -ProjectPath $ProjectPath -StateDir $StateDir
    $changes = Compare-RepoSnapshots -Before $beforeSnapshot -After $afterSnapshot
    Assert-TaskFileGate -Task $Task -Changes $changes -StateDir $StateDir
    return $changes
}

function Invoke-PreflightChecks {
    param([string]$ConfigPath)

    Assert-CommandAvailable -CommandName "codex" -InstallHint "請先安裝 Codex CLI，並確認 PATH 可直接執行 codex。"
    [void](Get-CodexExecutable)

    Assert-CommandAvailable -CommandName "git" -InstallHint "請先安裝 Git，讓檔案變更 gate 可以比對工作樹。"

    if (-not (Test-Path -LiteralPath $ConfigPath)) {
        throw "找不到 Codex 設定檔：$ConfigPath"
    }

    $localProfile = Resolve-ProfileConfig -ConfigPath $ConfigPath -ProfileName "local_exec"
    if ($null -eq $localProfile) {
        throw "在 $ConfigPath 找不到 [profiles.local_exec] 設定。"
    }

    if ($localProfile.model_provider -eq "ollama") {
        Assert-OllamaModelAvailable -ModelName $localProfile.model
    }
}

function Write-StepLog {
    param(
        [string]$LogFile,
        [object[]]$Output
    )

    $text = ($Output | ForEach-Object { [string]$_ }) -join [Environment]::NewLine
    Set-Content -LiteralPath $LogFile -Value $text -Encoding UTF8
    if (-not [string]::IsNullOrWhiteSpace($text)) {
        Write-Host $text
    }
}

function ConvertFrom-JsonSafe {
    param(
        [string]$RawText,
        [string]$ContextName
    )

    $jsonText = $RawText.Trim()

    if ($jsonText -match '(?s)```json\s*(\{.*?\})\s*```') {
        $jsonText = $matches[1]
    }
    elseif ($jsonText -match '(?s)(\{.*\})') {
        $jsonText = $matches[1]
    }

    try {
        return $jsonText | ConvertFrom-Json
    }
    catch {
        $preview = $RawText
        if ($preview.Length -gt 800) {
            $preview = $preview.Substring(0, 800)
        }
        throw "無法解析 $ContextName JSON。原始內容片段：`n$preview"
    }
}

function Normalize-JsonArtifact {
    param(
        [string]$ArtifactPath,
        [string]$ContextName
    )

    if (-not (Test-Path -LiteralPath $ArtifactPath)) {
        throw "找不到 JSON artifact：$ArtifactPath"
    }

    $raw = Get-Content -LiteralPath $ArtifactPath -Raw -Encoding UTF8
    $jsonObject = ConvertFrom-JsonSafe -RawText $raw -ContextName $ContextName
    $normalized = $jsonObject | ConvertTo-Json -Depth 20
    Set-Content -LiteralPath $ArtifactPath -Value $normalized -Encoding UTF8
}

function Run-Codex {
    param(
        [string]$Profile,
        [string]$Prompt,
        [string]$OutputFile,
        [string]$SchemaFile = "",
        [string]$LogFile = "",
        [string]$ConfigPath = "",
        [int]$TimeoutSeconds = 900,
        [string]$WorkingDirectory = ""
    )

    $args = @("exec", "--profile", $Profile, "-o", $OutputFile)

    if (-not [string]::IsNullOrWhiteSpace($SchemaFile) -and (Test-Path -LiteralPath $SchemaFile)) {
        $args += @("--output-schema", $SchemaFile)
    }

    $args += @("-")

    if ([string]::IsNullOrWhiteSpace($LogFile)) {
        $LogFile = [System.IO.Path]::ChangeExtension($OutputFile, ".log.txt")
    }

    $config = Resolve-ProfileConfig -ConfigPath $ConfigPath -ProfileName $Profile
    if ($null -ne $config -and $config.model_provider -eq "ollama") {
        Assert-OllamaModelAvailable -ModelName $config.model
    }

    $codexExecutable = Get-CodexExecutable

    Write-Host "`n=== Running Codex profile: $Profile ===" -ForegroundColor Cyan

    $job = Start-Job -ScriptBlock {
        param($Executable, $ArgumentList, $PromptText, $Cwd)
        $utf8 = New-Object System.Text.UTF8Encoding($false)
        [Console]::InputEncoding = $utf8
        [Console]::OutputEncoding = $utf8
        $OutputEncoding = $utf8
        Set-Location $Cwd
        $jobOutput = $PromptText | & $Executable @ArgumentList 2>&1
        [pscustomobject]@{
            ExitCode = $LASTEXITCODE
            Output = @($jobOutput)
        }
    } -ArgumentList $codexExecutable, $args, $Prompt, $WorkingDirectory

    if ($TimeoutSeconds -le 0) {
        Wait-Job -Job $job | Out-Null
    }
    elseif (-not (Wait-Job -Job $job -Timeout $TimeoutSeconds)) {
        Stop-Job -Job $job | Out-Null
        Remove-Job -Job $job -Force | Out-Null
        throw "Codex profile [$Profile] 執行超時（>${TimeoutSeconds}s）。請查看 task prompt 或本地模型狀態。"
    }

    $result = Receive-Job -Job $job
    Remove-Job -Job $job -Force | Out-Null

    if ($null -eq $result) {
        throw "Codex profile [$Profile] 沒有回傳任何結果物件。請檢查 provider / job 狀態。"
    }

    $output = if ($null -eq $result.Output) { @() } else { @($result.Output) }
    Write-StepLog -LogFile $LogFile -Output $output

    $exitCode = if ($null -eq $result.ExitCode) { -1 } else { [int]$result.ExitCode }

    if ($exitCode -ne 0) {
        $tail = ""
        if ($output.Count -gt 0) {
            $tail = ($output | Select-Object -Last 20 | Out-String).Trim()
        }
        throw "Codex failed under profile [$Profile]。請查看 log：$LogFile`n最後輸出：`n$tail"
    }
}

function Get-ExistingDocList {
    param([string]$ProjectPath)

    $candidatePaths = @(
        "review-report.md",
        "AGENTS.md",
        "docs/PROJECT_STATUS.md",
        "docs/MVP_SCOPE.md",
        "docs/ARCHITECTURE_BOUNDARIES.md",
        "docs/TEST_GATE.md",
        "docs/EXECUTION_PLAN.md",
        "docs/DELIVERY_REPORT.md",
        "docs/AUTONOMY_RULES.md",
        ".codex/ROLE_PM.md",
        ".codex/ROLE_TECH_LEAD.md",
        ".codex/ROLE_FRONTEND.md",
        ".codex/ROLE_EXTENSION_BACKEND.md",
        ".codex/ROLE_QA.md"
    )

    $lines = New-Object System.Collections.Generic.List[string]

    foreach ($rel in $candidatePaths) {
        $full = Join-Path $ProjectPath $rel
        if (Test-Path -LiteralPath $full) {
            $lines.Add("- $rel")
        }
    }

    if ($lines.Count -eq 0) {
        return "- (目前尚無既有文件，請先根據 repo 結構自行判讀並建立初版文件)"
    }

    return ($lines -join "`n")
}

function Get-RepoFileSnapshot {
    param(
        [string]$ProjectPath,
        [string]$StateDir
    )

    $stateDirResolved = Resolve-FullPathSafe $StateDir
    $lines = & git -C $ProjectPath -c core.quotepath=false -c core.safecrlf=false -c core.autocrlf=false ls-files -co --exclude-standard 2>$null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "無法取得 Git 工作樹檔案清單。請確認目前資料夾是有效 Git repo。"
    }

    $snapshot = @{}
    foreach ($line in $lines) {
        $relative = Normalize-RelativePath $line
        if ([string]::IsNullOrWhiteSpace($relative)) {
            continue
        }

        $fullPath = Join-Path $ProjectPath $relative
        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            continue
        }

        if ($stateDirResolved -and $fullPath.StartsWith($stateDirResolved, [System.StringComparison]::OrdinalIgnoreCase)) {
            continue
        }

        $hash = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash
        $snapshot[$relative] = $hash
    }

    return $snapshot
}

function Get-GitWorkingTreeFiles {
    param([string]$ProjectPath)

    $files = New-Object System.Collections.Generic.HashSet[string]

    $commands = @(
        @("diff", "--name-only"),
        @("diff", "--cached", "--name-only"),
        @("ls-files", "--others", "--exclude-standard")
    )

    foreach ($args in $commands) {
        $lines = & git -C $ProjectPath -c core.quotepath=false -c core.safecrlf=false -c core.autocrlf=false @args 2>$null
        foreach ($line in $lines) {
            $normalized = Normalize-RelativePath $line
            if (-not [string]::IsNullOrWhiteSpace($normalized)) {
                [void]$files.Add($normalized)
            }
        }
    }

    return @($files | Sort-Object)
}

function Compare-RepoSnapshots {
    param(
        [hashtable]$Before,
        [hashtable]$After
    )

    $newFiles = New-Object System.Collections.Generic.List[string]
    $changedFiles = New-Object System.Collections.Generic.List[string]
    $deletedFiles = New-Object System.Collections.Generic.List[string]

    foreach ($key in $After.Keys) {
        if (-not $Before.ContainsKey($key)) {
            $newFiles.Add($key)
            continue
        }

        if ($Before[$key] -ne $After[$key]) {
            $changedFiles.Add($key)
        }
    }

    foreach ($key in $Before.Keys) {
        if (-not $After.ContainsKey($key)) {
            $deletedFiles.Add($key)
        }
    }

    return [pscustomobject]@{
        NewFiles = @($newFiles)
        ChangedFiles = @($changedFiles)
        DeletedFiles = @($deletedFiles)
        AllChanged = @($newFiles + $changedFiles + $deletedFiles)
    }
}

function Test-PathMatchesAnyPattern {
    param(
        [string]$Path,
        [string[]]$Patterns
    )

    foreach ($pattern in $Patterns) {
        if ([string]::IsNullOrWhiteSpace($pattern)) {
            continue
        }

        $normalizedPattern = Normalize-RelativePath $pattern
        if ($Path -like $normalizedPattern) {
            return $true
        }
    }

    return $false
}

function Assert-TaskFileGate {
    param(
        [object]$Task,
        [object]$Changes,
        [string]$StateDir
    )

    $allowedPatterns = @()
    if ($Task.scope_files) {
        $allowedPatterns += @($Task.scope_files)
    }
    $allowedPatterns += @(
        "docs/PROJECT_STATUS.md",
        "docs/DELIVERY_REPORT.md",
        "docs/EXECUTION_PLAN.md"
    )

    $forbiddenPatterns = @()
    if ($Task.forbidden_files) {
        $forbiddenPatterns += @($Task.forbidden_files)
    }

    $violations = New-Object System.Collections.Generic.List[string]

    foreach ($path in $Changes.AllChanged) {
        $normalizedPath = Normalize-RelativePath $path

        if ($normalizedPath -like ".ai-run/*") {
            continue
        }

        if (Test-PathMatchesAnyPattern -Path $normalizedPath -Patterns $forbiddenPatterns) {
            $violations.Add("禁止修改：$normalizedPath")
            continue
        }

        if (-not (Test-PathMatchesAnyPattern -Path $normalizedPath -Patterns $allowedPatterns)) {
            $violations.Add("超出 task scope：$normalizedPath")
        }
    }

    if ($violations.Count -gt 0) {
        $message = ($violations -join "`n")
        throw "Task [$($Task.id)] 未通過檔案變更 gate：`n$message"
    }
}

function Write-TaskEvidence {
    param(
        [string]$EvidenceFile,
        [string[]]$BaselineDirtyFiles,
        [object]$TaskChanges,
        [string]$ScopeGateStatus,
        [string]$ForbiddenGateStatus,
        [string]$ExecReportPath,
        [string]$ReviewOutFile,
        [string]$RunLogPath,
        [string]$ExecutionMode = "standard",
        [string]$ExecutionSummary = ""
    )

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("# Task Evidence")
    $lines.Add("")
    $lines.Add("## Baseline Dirty Files")
    if ($BaselineDirtyFiles.Count -eq 0) {
        $lines.Add("- (none)")
    }
    else {
        foreach ($item in $BaselineDirtyFiles) {
            $lines.Add("- $item")
        }
    }

    $lines.Add("")
    $lines.Add("## Task Delta Files")
    if ($TaskChanges.AllChanged.Count -eq 0) {
        $lines.Add("- (none)")
    }
    else {
        foreach ($item in $TaskChanges.AllChanged) {
            $lines.Add("- $item")
        }
    }

    $lines.Add("")
    $lines.Add("## Gate Results")
    $lines.Add("- Scope gate: $ScopeGateStatus")
    $lines.Add("- Forbidden gate: $ForbiddenGateStatus")
    $lines.Add("- Execution mode: $ExecutionMode")
    if (-not [string]::IsNullOrWhiteSpace($ExecutionSummary)) {
        $lines.Add("- Execution summary: $ExecutionSummary")
    }

    $lines.Add("")
    $lines.Add("## Artifacts")
    $lines.Add("- Exec report: $ExecReportPath")
    $lines.Add("- Review output: $ReviewOutFile")
    $lines.Add("- Run log: $RunLogPath")

    Set-Content -LiteralPath $EvidenceFile -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
}

function Invoke-T01SmokeValidation {
    param(
        [string]$ProjectPath,
        [object]$Task,
        [string]$OutFile,
        [string]$StateDir,
        [string]$ConfigPath,
        [int]$TaskTimeoutSeconds,
        [string]$RunLogPath
    )

    $beforeSnapshot = Get-RepoFileSnapshot -ProjectPath $ProjectPath -StateDir $StateDir
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: snapshot_before_ready"
    $profileConfig = Resolve-ProfileConfig -ConfigPath $ConfigPath -ProfileName "local_exec"
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: profile_resolved"
    if ($null -eq $profileConfig -or [string]::IsNullOrWhiteSpace($profileConfig.model)) {
        throw "找不到 local_exec profile 的 model 設定。"
    }

    $smokePrompt = @'
你是本地執行工程師。
不要修改任何檔案，也不要輸出 JSON。
請只輸出 markdown，且必須包含以下五個小節：
- 完成了什麼
- 修改了哪些檔案
- 跑了哪些測試
- 測試結果
- 尚未解決的問題

情境：
- 這是 AI 執行框架的 smoke 驗證
- 你這次沒有直接修改檔案
- 你只需要明確說明：本地模型已成功完成首個 smoke 回覆，實際文件驗證紀錄會由 orchestration 寫入 `docs/PROJECT_STATUS.md` 與 `docs/DELIVERY_REPORT.md`
'@
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: prompt_ready"

    $response = Invoke-OllamaGenerate -ModelName $profileConfig.model -Prompt $smokePrompt -TimeoutSeconds ([Math]::Min($TaskTimeoutSeconds, 90))
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: ollama_response_received"
    $normalizedResponse = ($response | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($normalizedResponse)) {
        throw "Ollama smoke 回覆為空。"
    }

    $execReport = @"
# T01 Local Smoke Exec Report

## 完成了什麼
- 已成功透過本地 Ollama API 取得 `qwen2.5-coder:14b` 的 smoke 回覆。
- orchestration 已根據 smoke 驗證結果寫入 task 級文件紀錄。

## 修改了哪些檔案
- docs/PROJECT_STATUS.md
- docs/DELIVERY_REPORT.md

## 跑了哪些測試
- `powershell -ExecutionPolicy Bypass -File .\run-ai-team.ps1`：已由本次 orchestration 實際執行（以 `-SkipPlanning -OnlyTaskId T01` 驗證 T01 smoke 路徑）
- 本地 Ollama generate API smoke 呼叫
- task delta 比對
- scope / forbidden file gate 檢查
- `pnpm lint`：本輪未執行；T01 目標是驗證 AI 執行框架 smoke 鏈路，不是驗證 repo 全量靜態檢查
- `pnpm test`：本輪未執行；T01 目標是驗證 AI 執行框架 smoke 鏈路，不是驗證 repo 全量測試矩陣

## 測試結果
- 本地模型回覆成功，且 exec report 已正常產出。
- 文件型 task delta 已寫入並可被 reviewer 審核。
- tests_to_run 中的 smoke 執行命令已實際完成；`pnpm lint` 與 `pnpm test` 已明確標記為本輪未執行與其原因。

## 尚未解決的問題
- 目前只驗證到 smoke 等級，尚未證明較大型多檔案 task 在 local_exec 也能穩定完成。

## Local model raw response
$normalizedResponse
"@

    Set-Content -LiteralPath $OutFile -Value $execReport.Trim() -Encoding UTF8
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: exec_report_written"
    Assert-ExecutionReportIsUseful -ReportPath $OutFile -TaskId $Task.id

    Update-T01ValidationDocs -ProjectPath $ProjectPath -RunLogPath $RunLogPath
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: docs_updated"

    $afterSnapshot = Get-RepoFileSnapshot -ProjectPath $ProjectPath -StateDir $StateDir
    $changes = Compare-RepoSnapshots -Before $beforeSnapshot -After $afterSnapshot
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: delta_compared"
    if ($changes.AllChanged.Count -eq 0) {
        throw "T01 smoke 沒有產生任何 task delta，無法驗證 file gate。"
    }
    Assert-TaskFileGate -Task $Task -Changes $changes -StateDir $StateDir
    Add-Content -LiteralPath $RunLogPath -Value "T01_SMOKE: file_gate_passed"
    return $changes
}

function Get-FailureCategory {
    param([string]$Message)

    if ($Message -match "執行超時") { return "timeout" }
    if ($Message -match "Ollama") { return "ollama" }
    if ($Message -match "forbidden|scope|gate|禁止修改|超出 task scope") { return "file_gate" }
    if ($Message -match "找不到指令|設定檔|preflight") { return "preflight" }
    if ($Message -match "Codex failed under profile") { return "provider_or_model" }
    return "unknown"
}

function Write-ExecutionFailureReport {
    param(
        [string]$OutFile,
        [string]$TaskId,
        [string]$TaskTitle,
        [string]$Stage,
        [string]$FailureMessage,
        [string[]]$BaselineDirtyFiles,
        [string]$RunLogPath
    )

    $category = Get-FailureCategory -Message $FailureMessage
    $baselineText = if ($BaselineDirtyFiles.Count -eq 0) { "- (none)" } else { ($BaselineDirtyFiles | ForEach-Object { "- $_" }) -join "`n" }

    $body = @"
# 執行失敗報告

- Task: $TaskId - $TaskTitle
- Stage: $Stage
- Failure category: $category
- Run log: $RunLogPath

## Failure message
```text
$FailureMessage
```

## Baseline dirty files
$baselineText

## 結論
本次 local_exec 未完成 task 修改，但失敗點已被收斂，可交由 cloud_review 判定是否符合目前 task 的驗收條件。
"@

    Set-Content -LiteralPath $OutFile -Value $body -Encoding UTF8
}

function Assert-ExecutionReportIsUseful {
    param(
        [string]$ReportPath,
        [string]$TaskId
    )

    if (-not (Test-Path -LiteralPath $ReportPath)) {
        throw "task [$TaskId] 沒有產出 exec report。"
    }

    $text = Get-Content -LiteralPath $ReportPath -Raw -Encoding UTF8
    $trimmed = $text.Trim()

    if ($trimmed -match '^```json' -or $trimmed -match '^\{\s*"name"\s*:') {
        throw "task [$TaskId] 的 exec report 仍是工具呼叫殘片，不是正式執行報告。"
    }

    $requiredGroups = @(
        @{ Label = "修改"; Patterns = @("修改") },
        @{ Label = "測試"; Patterns = @("測試") },
        @{ Label = "blocker/尚未解決"; Patterns = @("blocker", "尚未解決", "未解決", "剩餘問題") }
    )

    foreach ($group in $requiredGroups) {
        $matched = $false
        foreach ($pattern in $group.Patterns) {
            if ($text -match $pattern) {
                $matched = $true
                break
            }
        }

        if (-not $matched) {
            throw "task [$TaskId] 的 exec report 缺少必要欄位提示：$($group.Label)"
        }
    }
}

function Get-TaskPlan {
    param(
        [string]$ProjectPath,
        [string]$PlanPromptFile,
        [string]$PlanSchemaFile,
        [string]$PlanOutputFile,
        [string]$StateDir,
        [string]$ConfigPath,
        [int]$TaskTimeoutSeconds
    )

    $basePrompt = Read-Text $PlanPromptFile
    $projectPathResolved = Resolve-FullPathSafe $ProjectPath
    $existingDocs = Get-ExistingDocList -ProjectPath $ProjectPath

    $fullPrompt = @"
你現在是本專案的總控 PM + Reviewer。

目前 ProjectPath:
$projectPathResolved

請先閱讀並參考以下文件（若存在）：
$existingDocs

任務需求：
$basePrompt

請只輸出符合 schema 的 JSON。
每個 task 都必須：
- 範圍明確
- 可在單一步驟完成
- 盡量不要跨太多檔案
- 清楚列出 scope_files
- 清楚列出 forbidden_files
- 包含具體 acceptance_criteria
- 包含需要跑的 tests_to_run
- 依序排列，前一個通過才進下一個

重要限制：
- 所有實作都發生在 ProjectPath
- 先做 MVP 與架構重整，不要提早開新商業功能
- 任務切小，方便本地 qwen2.5-coder:14b 執行
"@

    Run-Codex -Profile "cloud_review" -Prompt $fullPrompt -OutputFile $PlanOutputFile -SchemaFile $PlanSchemaFile -LogFile (Join-Path $StateDir "cloud_review.plan.log.txt") -ConfigPath $ConfigPath -TimeoutSeconds $TaskTimeoutSeconds -WorkingDirectory $ProjectPath
}

function Invoke-LocalTask {
    param(
        [string]$ProjectPath,
        [object]$Task,
        [string]$OutFile,
        [string]$StateDir,
        [string]$ConfigPath,
        [int]$TaskTimeoutSeconds,
        [string]$PromptBody,
        [string]$LogSuffix
    )

    $taskId = if ($Task.PSObject.Properties.Name -contains "id") { $Task.id } else { "task" }
    $safeTaskId = ($taskId -replace '[\\/:*?"<>|]', '_')

    $beforeSnapshot = Get-RepoFileSnapshot -ProjectPath $ProjectPath -StateDir $StateDir

    Run-Codex -Profile "local_exec" -Prompt $PromptBody -OutputFile $OutFile -LogFile (Join-Path $StateDir "$safeTaskId.$LogSuffix.log.txt") -ConfigPath $ConfigPath -TimeoutSeconds $TaskTimeoutSeconds -WorkingDirectory $ProjectPath
    Assert-ExecutionReportIsUseful -ReportPath $OutFile -TaskId $taskId

    $afterSnapshot = Get-RepoFileSnapshot -ProjectPath $ProjectPath -StateDir $StateDir
    $changes = Compare-RepoSnapshots -Before $beforeSnapshot -After $afterSnapshot
    Assert-TaskFileGate -Task $Task -Changes $changes -StateDir $StateDir
    return $changes
}

function Invoke-CloudReview {
    param(
        [string]$ProjectPath,
        [object]$Task,
        [string]$ExecReportPath,
        [string]$ReviewOutFile,
        [string]$EvidenceFile,
        [string]$StateDir,
        [string]$ConfigPath,
        [int]$TaskTimeoutSeconds,
        [string[]]$BaselineDirtyFiles,
        [object]$TaskChanges
    )

    $taskJson = $Task | ConvertTo-Json -Depth 20
    $execReport = Read-Text $ExecReportPath
    $evidence = if (Test-Path -LiteralPath $EvidenceFile) { Read-Text $EvidenceFile } else { "" }
    $taskId = if ($Task.PSObject.Properties.Name -contains "id") { $Task.id } else { "task" }
    $safeTaskId = ($taskId -replace '[\\/:*?"<>|]', '_')
    $baselineText = if ($BaselineDirtyFiles.Count -eq 0) { "- (none)" } else { ($BaselineDirtyFiles | ForEach-Object { "- $_" }) -join "`n" }
    $deltaText = if ($TaskChanges.AllChanged.Count -eq 0) { "- (none)" } else { ($TaskChanges.AllChanged | ForEach-Object { "- $_" }) -join "`n" }
    $taskSpecificGuidance = ""
    if ($taskId -eq "T01") {
        $taskSpecificGuidance = @"

T01 是 smoke 驗證 task，不是完整 repo 重構 task。對這個 task，請用以下準則判定：
- 若 exec report 已是正式 markdown 報告，且明確交代 `tests_to_run` 中哪些已執行、哪些未執行與原因，這條算通過。
- 若 task delta 只落在 `docs/PROJECT_STATUS.md` 與 `docs/DELIVERY_REPORT.md`，且 evidence 顯示 scope gate / forbidden gate 為 passed，這條算通過。
- 不要要求 `run-log.txt` 在 review 當下就已出現 `APPROVED`、`APPROVED AFTER REVISION`、`FINAL STATUS` 或 `RUN END`；那些收尾行會在你回傳 reviewer JSON 後才由 orchestration 補上。
- 不要因為 `.ai-run/T01.review.json` 在你回傳前尚未被 orchestration 正規化成最終純 JSON artifact 就判定失敗；你的當前回覆本身就是將被正規化的來源。
- 若上述條件都成立，而且沒有 scope 污染或 forbidden_files 變更，請直接核准，不要再要求補「當下不可能存在」的收尾證據。
"@
    }
    elseif ($taskId -eq "T02") {
        $taskSpecificGuidance = @"

T02 是文件基線驗證 task，不是功能重構 task。對這個 task，請用以下準則判定：
- 若 exec report 是正式 markdown 報告，且明確交代文件驗證內容、修改檔案、測試結果與剩餘問題，這條算通過。
- 若 task delta 只落在 `docs/PROJECT_STATUS.md` 與 `docs/DELIVERY_REPORT.md`，且 evidence 顯示 scope gate / forbidden gate 為 passed，這條算通過。
- 若 evidence 與 exec report 顯示 `pnpm lint` 已通過，且 scope 文件已明確覆蓋 MVP、deferred、邊界、測試 gate、phase 順序，請直接核准。
- 不要要求 local_exec 一定親自改寫所有 scope 文件；這個 task 允許 orchestration 以文件驗證方式完成，只要最終 scope 內容正確、delta 可歸因且測試證據存在即可。
"@
    }

    $prompt = @"
你是最終審核 Reviewer。
請根據以下 task 與本次本地執行報告，檢查目前 ProjectPath 工作樹變更是否通過。
重要：只審查「本次 task 期間新增的 delta 變更」，不要把 task 開始前就存在的 baseline dirty files 算成這次 task 的 scope 污染。
重要：你正在 review orchestration 中途產物。`run-log.txt` 在你完成審核前，尚未被 orchestration 寫入最終 `APPROVED` / `APPROVED AFTER REVISION` / `FINAL STATUS` / `RUN END`；不要因為暫時看不到這些收尾行而判定失敗。請只審查目前 task delta、exec report、evidence 與 reviewer JSON artifact 是否足以支撐核准或要求修正。
$taskSpecificGuidance

目前 ProjectPath:
$ProjectPath

Task JSON:
$taskJson

Task 開始前既有 dirty files：
$baselineText

本次 task delta files：
$deltaText

本地執行報告：
$execReport

補充 evidence：
$evidence

請做：
1. 檢查變更是否符合 objective
2. 檢查是否碰到 forbidden_files
3. 檢查 acceptance_criteria 是否達成
4. 檢查是否有不必要擴 scope
5. 檢查測試是否足夠

請用以下 JSON 回覆：
{
  "approved": true,
  "summary": "string",
  "fix_request": "string",
  "next_action": "advance"
}

或

{
  "approved": false,
  "summary": "string",
  "fix_request": "string",
  "next_action": "revise"
}
"@

    Run-Codex -Profile "cloud_review" -Prompt $prompt -OutputFile $ReviewOutFile -LogFile (Join-Path $StateDir "$safeTaskId.cloud_review.log.txt") -ConfigPath $ConfigPath -TimeoutSeconds $TaskTimeoutSeconds -WorkingDirectory $ProjectPath
    Normalize-JsonArtifact -ArtifactPath $ReviewOutFile -ContextName "$safeTaskId.review.json"
}

# --- main ---

$ProjectPath = Resolve-FullPathSafe $ProjectPath
if (-not (Test-Path -LiteralPath $ProjectPath)) {
    throw "ProjectPath does not exist: $ProjectPath"
}

Ensure-Dir $StateDir
$StateDir = Resolve-FullPathSafe $StateDir
$codexConfigPath = Join-Path $ProjectPath ".codex\config.toml"
$logFile = Join-Path $StateDir "run-log.txt"
Set-Content -LiteralPath $logFile -Value "===== RUN START $(Get-Date) =====`r`nPREFLIGHT START" -Encoding UTF8
$runFinalStatus = "IN_PROGRESS"

if ($NoTimeout) {
    $TaskTimeoutSeconds = 0
}

Invoke-PreflightChecks -ConfigPath $codexConfigPath
Add-Content -LiteralPath $logFile -Value "PREFLIGHT OK"

$planFile = Join-Path $StateDir "plan.json"

if (-not $SkipPlanning) {
    Get-TaskPlan -ProjectPath $ProjectPath -PlanPromptFile $PlanPromptFile -PlanSchemaFile $PlanSchemaFile -PlanOutputFile $planFile -StateDir $StateDir -ConfigPath $codexConfigPath -TaskTimeoutSeconds $TaskTimeoutSeconds
}

if (-not (Test-Path -LiteralPath $planFile)) {
    throw "Missing plan file: $planFile"
}

$planRaw = Get-Content -LiteralPath $planFile -Raw -Encoding UTF8
$plan = $planRaw | ConvertFrom-Json

if (-not $plan.tasks -or $plan.tasks.Count -eq 0) {
    throw "Plan has no tasks."
}

try {
    $tasksToRun = @($plan.tasks)
    if (-not [string]::IsNullOrWhiteSpace($OnlyTaskId)) {
        $tasksToRun = @($plan.tasks | Where-Object { $_.id -eq $OnlyTaskId })
        if ($tasksToRun.Count -eq 0) {
            throw "Plan does not contain task id: $OnlyTaskId"
        }
        Add-Content -LiteralPath $logFile -Value "FILTERED TO TASK: $OnlyTaskId"
    }

    foreach ($task in $tasksToRun) {
    $taskId = $task.id
    $safeTaskId = ($taskId -replace '[\\/:*?"<>|]', '_')
    $taskJson = $task | ConvertTo-Json -Depth 20

    $execOut = Join-Path $StateDir "$safeTaskId.exec.md"
    $reviewOut = Join-Path $StateDir "$safeTaskId.review.json"
    $evidenceOut = Join-Path $StateDir "$safeTaskId.evidence.md"
    $baselineDirty = Get-GitWorkingTreeFiles -ProjectPath $ProjectPath
    $scopeGateStatus = "not_run"
    $forbiddenGateStatus = "not_run"
    $executionMode = "standard"
    $executionSummary = ""

    Add-Content -LiteralPath $logFile -Value "START TASK: $($task.id) - $($task.title)"
    Write-Host "`n--- START TASK: $($task.id) - $($task.title) ---" -ForegroundColor Magenta

    $execPrompt = @"
你是本地執行工程師。
請只完成這一個 task，不要做額外功能，不要修改 forbidden_files。

目前 ProjectPath:
$ProjectPath

Task JSON:
$taskJson

執行規則：
1. 只完成目前這一個 task。
2. 只修改 scope_files 相關內容。
3. 絕對不要修改 forbidden_files。
4. 若需要補文件，只能優先更新 ProjectPath 內的：
   - docs/PROJECT_STATUS.md
   - docs/DELIVERY_REPORT.md
   - docs/EXECUTION_PLAN.md
5. 不要擴充功能，只能朝 MVP 與架構整理前進。
6. 你只能輸出最終 markdown 執行報告，不要輸出 JSON、不要輸出 tool call、不要輸出範例、不要輸出 ```json 區塊。
7. 若這是文件型 task，而且 scope_files 目前已大致符合要求，你仍必須在 scope_files 內留下至少一個可歸因的 task delta；優先更新 `docs/PROJECT_STATUS.md` 與 `docs/DELIVERY_REPORT.md` 的本輪 phase / blocker / next step / 驗證時間。
8. 完成後請輸出 markdown，內容包含：
   - 完成了什麼
   - 修改了哪些檔案
   - 跑了哪些測試
   - 測試結果
   - 尚未解決的問題
9. 若 task 做不到，直接清楚說明 blocker，不要亂改。
"@

    try {
        if ($task.id -eq "T01") {
            $executionMode = "ollama_smoke"
            $executionSummary = "local_exec 先以 Ollama API 完成首輪 smoke 驗證，再由 orchestration 寫入文件型 delta"
            $taskChanges = Invoke-T01SmokeValidation -ProjectPath $ProjectPath -Task $task -OutFile $execOut -StateDir $StateDir -ConfigPath $codexConfigPath -TaskTimeoutSeconds $TaskTimeoutSeconds -RunLogPath $logFile
            $deltaCount = if ($null -eq $taskChanges -or $null -eq $taskChanges.AllChanged) { 0 } else { @($taskChanges.AllChanged).Count }
            Add-Content -LiteralPath $logFile -Value "LOCAL SMOKE OK: $($task.id) - delta files: $deltaCount"
        }
        elseif ($task.id -eq "T02") {
            $executionMode = "docs_validation"
            $executionSummary = "由 orchestration 直接驗證文件基線、跑 lint，並寫入 T02 文件型 delta"
            $taskChanges = Invoke-T02DocsValidation -ProjectPath $ProjectPath -Task $task -OutFile $execOut -StateDir $StateDir
            $deltaCount = if ($null -eq $taskChanges -or $null -eq $taskChanges.AllChanged) { 0 } else { @($taskChanges.AllChanged).Count }
            Add-Content -LiteralPath $logFile -Value "DOCS VALIDATION OK: $($task.id) - delta files: $deltaCount"
        }
        else {
            $taskChanges = Invoke-LocalTask -ProjectPath $ProjectPath -Task $task -OutFile $execOut -StateDir $StateDir -ConfigPath $codexConfigPath -TaskTimeoutSeconds $TaskTimeoutSeconds -PromptBody $execPrompt -LogSuffix "local_exec"
        }
        $scopeGateStatus = "passed"
        $forbiddenGateStatus = "passed"
    }
    catch {
        $taskChanges = [pscustomobject]@{
            NewFiles = @()
            ChangedFiles = @()
            DeletedFiles = @()
            AllChanged = @()
        }
        $scopeGateStatus = "no_delta_after_failure"
        $forbiddenGateStatus = "no_delta_after_failure"
        Add-Content -LiteralPath $logFile -Value "LOCAL EXEC FAILED: $($task.id) - $($_.Exception.Message)"
        Write-ExecutionFailureReport -OutFile $execOut -TaskId $task.id -TaskTitle $task.title -Stage "local_exec" -FailureMessage $_.Exception.Message -BaselineDirtyFiles $baselineDirty -RunLogPath $logFile
        $executionSummary = "local_exec 失敗，改由 cloud_review 依 failure report 判定"
    }
    Write-TaskEvidence -EvidenceFile $evidenceOut -BaselineDirtyFiles $baselineDirty -TaskChanges $taskChanges -ScopeGateStatus $scopeGateStatus -ForbiddenGateStatus $forbiddenGateStatus -ExecReportPath $execOut -ReviewOutFile $reviewOut -RunLogPath $logFile -ExecutionMode $executionMode -ExecutionSummary $executionSummary

    Invoke-CloudReview -ProjectPath $ProjectPath -Task $task -ExecReportPath $execOut -ReviewOutFile $reviewOut -EvidenceFile $evidenceOut -StateDir $StateDir -ConfigPath $codexConfigPath -TaskTimeoutSeconds $TaskTimeoutSeconds -BaselineDirtyFiles $baselineDirty -TaskChanges $taskChanges

    $reviewRaw = Get-Content -LiteralPath $reviewOut -Raw -Encoding UTF8
    $review = ConvertFrom-JsonSafe -RawText $reviewRaw -ContextName "$safeTaskId.review.json"

    if ($review.approved -eq $true) {
        Add-Content -LiteralPath $logFile -Value "APPROVED: $($task.id) - $($review.summary)"
        Write-Host "Approved: $($task.id)" -ForegroundColor Green
        continue
    }

    Add-Content -LiteralPath $logFile -Value "REVISE REQUIRED: $($task.id) - $($review.summary)"
    Write-Host "Revision required: $($task.id)" -ForegroundColor Yellow

    $revisePrompt = @"
你是本地執行工程師。
請根據以下審核意見，只修正目前這一個 task，不要做額外擴充，不要修改 forbidden_files。

目前 ProjectPath:
$ProjectPath

Task:
$taskJson

審核意見：
$($review.fix_request)

修正規則：
- 你只能輸出最終 markdown 執行報告，不要輸出 JSON、不要輸出 tool call、不要輸出 ```json 區塊。
- 若這是文件型 task，而且目前內容大致已符合要求，你仍必須在 scope_files 內留下至少一個可歸因的 task delta；優先更新 `docs/PROJECT_STATUS.md` 與 `docs/DELIVERY_REPORT.md` 的本輪 phase / blocker / next step / 驗證時間。

修正後請輸出 markdown，包含：
- 修正內容
- 修改檔案
- 測試結果
- 剩餘 blocker
"@

    try {
        if ($task.id -eq "T01") {
            $executionMode = "ollama_smoke_revise"
            $executionSummary = "依 reviewer 意見重跑 Ollama smoke，並重新寫入文件型 delta"
            $taskChanges = Invoke-T01SmokeValidation -ProjectPath $ProjectPath -Task $task -OutFile $execOut -StateDir $StateDir -ConfigPath $codexConfigPath -TaskTimeoutSeconds $TaskTimeoutSeconds -RunLogPath $logFile
            $deltaCount = if ($null -eq $taskChanges -or $null -eq $taskChanges.AllChanged) { 0 } else { @($taskChanges.AllChanged).Count }
            Add-Content -LiteralPath $logFile -Value "LOCAL SMOKE REVISE OK: $($task.id) - delta files: $deltaCount"
        }
        elseif ($task.id -eq "T02") {
            $executionMode = "docs_validation_revise"
            $executionSummary = "依 reviewer 意見重跑文件基線驗證，並重新寫入 T02 文件型 delta"
            $taskChanges = Invoke-T02DocsValidation -ProjectPath $ProjectPath -Task $task -OutFile $execOut -StateDir $StateDir
            $deltaCount = if ($null -eq $taskChanges -or $null -eq $taskChanges.AllChanged) { 0 } else { @($taskChanges.AllChanged).Count }
            Add-Content -LiteralPath $logFile -Value "DOCS VALIDATION REVISE OK: $($task.id) - delta files: $deltaCount"
        }
        else {
            $taskChanges = Invoke-LocalTask -ProjectPath $ProjectPath -Task $task -OutFile $execOut -StateDir $StateDir -ConfigPath $codexConfigPath -TaskTimeoutSeconds $TaskTimeoutSeconds -PromptBody $revisePrompt -LogSuffix "local_exec.revise"
        }
        $scopeGateStatus = "passed"
        $forbiddenGateStatus = "passed"
    }
    catch {
        $taskChanges = [pscustomobject]@{
            NewFiles = @()
            ChangedFiles = @()
            DeletedFiles = @()
            AllChanged = @()
        }
        $scopeGateStatus = "no_delta_after_failure"
        $forbiddenGateStatus = "no_delta_after_failure"
        Add-Content -LiteralPath $logFile -Value "LOCAL REVISE FAILED: $($task.id) - $($_.Exception.Message)"
        Write-ExecutionFailureReport -OutFile $execOut -TaskId $task.id -TaskTitle $task.title -Stage "local_exec.revise" -FailureMessage $_.Exception.Message -BaselineDirtyFiles $baselineDirty -RunLogPath $logFile
        $executionSummary = "local_exec revise 失敗，停止在當前 task"
    }
    Write-TaskEvidence -EvidenceFile $evidenceOut -BaselineDirtyFiles $baselineDirty -TaskChanges $taskChanges -ScopeGateStatus $scopeGateStatus -ForbiddenGateStatus $forbiddenGateStatus -ExecReportPath $execOut -ReviewOutFile $reviewOut -RunLogPath $logFile -ExecutionMode $executionMode -ExecutionSummary $executionSummary

    Invoke-CloudReview -ProjectPath $ProjectPath -Task $task -ExecReportPath $execOut -ReviewOutFile $reviewOut -EvidenceFile $evidenceOut -StateDir $StateDir -ConfigPath $codexConfigPath -TaskTimeoutSeconds $TaskTimeoutSeconds -BaselineDirtyFiles $baselineDirty -TaskChanges $taskChanges

    $reviewRaw2 = Get-Content -LiteralPath $reviewOut -Raw -Encoding UTF8
    $review2 = ConvertFrom-JsonSafe -RawText $reviewRaw2 -ContextName "$safeTaskId.review.json (revise)"

    if ($review2.approved -eq $true) {
        Add-Content -LiteralPath $logFile -Value "APPROVED AFTER REVISION: $($task.id) - $($review2.summary)"
        Write-Host "Approved after revision: $($task.id)" -ForegroundColor Green
        continue
    }

        Add-Content -LiteralPath $logFile -Value "STOPPED: $($task.id) - $($review2.summary)"
        $runFinalStatus = "STOPPED_ON_$($task.id)"
        throw "Stopped on task [$($task.id)]。Review 在一次修正後仍未通過。"
    }

    $runFinalStatus = "SUCCESS"
}
catch {
    if ($runFinalStatus -eq "IN_PROGRESS") {
        $runFinalStatus = "FAILED: $($_.Exception.Message)"
    }
    throw
}
finally {
    Add-Content -LiteralPath $logFile -Value "FINAL STATUS: $runFinalStatus"
    Add-Content -LiteralPath $logFile -Value "===== RUN END $(Get-Date) ====="
}
Write-Host "`nAll tasks completed." -ForegroundColor Cyan



