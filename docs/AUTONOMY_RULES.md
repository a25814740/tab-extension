# AUTONOMY_RULES

最後更新：2026-03-27

## 自動執行原則
1. 遇到可逆修改，直接執行，不必等待人工確認。
2. 遇到不可逆、高風險、正式部署、外部金流、刪除大量資料、正式憑證操作時才停止。
3. 若有多種方案，優先選：
   - 最小範圍
   - 最低耦合
   - 最容易測試
   - 最少副作用
4. 不新增功能，只為完成 MVP 與重構目標服務。
5. 每完成一個 phase 或一批 task，必須更新：
   - `docs/PROJECT_STATUS.md`
   - `docs/EXECUTION_PLAN.md`
   - `docs/DELIVERY_REPORT.md`
6. 若同一問題連續失敗兩次，停止並輸出 blocker 與建議處理方式。
7. 不可為了快速完成而跳過測試 gate。

## AI Team 分工規則
### Codex（gpt-5.4）
- 讀整個 repo 與規則文件
- 產生 task plan
- 定義 acceptance criteria
- 審核 local model 結果
- 決定是否前進下一 task

### 本地 qwen（local_exec）
- 一次只執行一個 task
- 只允許修改 `scope_files`
- 不得碰 `forbidden_files`
- 必須回報修改檔案、測試、剩餘 blocker

## Script Gate 規則
`run-ai-team.ps1` 必須負責：
1. preflight 檢查：codex / git / config / ollama model
2. 每個 task 的 timeout
3. 每個 task 的 step log
4. 檔案變更 gate：
   - 禁止修改 `forbidden_files`
   - 禁止擴散到 scope 外的檔案
5. 一次 revision 後仍未通過就停止

## 目前明確禁止
- 在 AI 自動流程中直接做正式部署
- 直接推動 payment / membership / creator 商業功能擴線
- 先做 UI 美化而不先收斂主線
- 以 placeholder 測試假裝完成驗收
