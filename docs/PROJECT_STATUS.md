# PROJECT_STATUS

最後更新：2026-03-29

## 1. 專案目標
Taboard 目前的主線仍是 Chrome 新分頁 tab 管理工具。現階段不是擴功能，而是把 MVP 收斂、邊界定清楚、拆掉巨石、補成可信的測試基線，讓專案可以持續開發而不是一直補洞。

## 2. 系統現況摘要

### 已具備
- React newtab 主介面與基本 workspace / space / collection / tab 結構
- 本地 snapshot / store 基礎能力
- extension 基本 runtime 架構
- Supabase / sync / membership / payment 初步接線
- Creator 後台與 preview 流程原型

### 目前正在重整
- `apps/newtab/src/ui/App.tsx` 仍偏大，尚未完成 shell / sidebar / content / overlays 分層
- `packages/core/src/store/appStore.ts` 仍偏重，hydrate / sync / actions 邊界待拆
- sync / membership / payment 的責任與 vocabulary 仍未完全收斂
- 測試仍混有 placeholder 或低信任度案例，需要換成真流程

### 明確延後
- Creator 商城完整上架流程
- Theme Store / 分潤
- 模板商店
- 複雜多人協作
- 非 MVP 的商業後台與視覺擴充線

## 2.5 Creator / 商業化路線
Creator 已從「附屬原型」改為「第二階段商業化基礎建設」，但仍然不是 MVP 主線。

### Phase 1
- 讓 creator 後台穩定登入
- preview 與前台結構對齊
- 能建立 / 編輯 / 儲存 / 發佈主題
- 不做模板商店
- 不做自動撥款

### Phase 2
- Theme Store 受控上架
- 購買與套用
- 分潤 ledger
- 月結人工匯款

### Phase 3
- 自動結算與規模化 marketplace
- 模板商店評估
- 多創作者管理與推廣機制

### 目前判定
- Creator 可以做，但只能依 `docs/CREATOR_ROADMAP.md` 推進
- 任何 creator / theme / payout 任務若會影響 MVP 主線，必須先回到文件收斂

## 3. 目前主線判定
MVP 目前只接受以下主線：
- newtab tab 管理
- workspace / space / collection 基本操作
- local-first 資料持久化與 hydrate
- 基本同步能力
- 最低限度的錯誤與狀態顯示

這代表 Creator / Theme / Billing 相關需求目前只能保留，不可插隊。

## 4. AI 執行流程現況
repo 目前已有一套雙層 AI 執行框架：
- Codex（gpt-5.4）負責讀 repo、規劃 task、審核 task、決定是否前進
- 本地 Ollama qwen 負責執行單一小任務、改 scope files、跑指定測試
- `run-ai-team.ps1` 負責 planning -> local execution -> cloud review

### 已完成的安全欄杆
- preflight 檢查（codex / git / config / ollama model）
- local task timeout 與 retry
- 每個 step 的獨立 log
- baseline dirty files 與 task delta evidence
- scope / forbidden file gate
- review artifact JSON 正規化

## 5. 已知主要問題
- `App.tsx` 與 `appStore.ts` 仍是主技術債與耦合中心
- sync boundary 與 business metadata boundary 還停留在文件收斂階段
- placeholder 測試尚未全面替換
- Creator 與前台共享 UI 的整合仍是過渡中，不屬於 MVP 主線

## 6. Blockers
- [x] T01 已完成 smoke 驗證，AI orchestration 基本可用
- [x] T02 已將 MVP / deferred / 測試 gate / 邊界文件收斂成可執行版本
- [ ] App.tsx 重構前，仍缺真正的回歸保護
- [ ] appStore.ts 拆分前，仍需先守住 hydrate / sync / actions 責任界線
- [ ] sync / membership / payment 邏輯尚未被真實測試完整覆蓋

## 7. 本輪進度紀錄

### 已完成
- [x] AI 任務規劃 schema 與 prompt 初版
- [x] `run-ai-team.ps1` 基本串接
- [x] `run-ai-team.ps1` 補上 preflight / timeout / log / file gate
- [x] `run-ai-team.ps1` 補上 baseline dirty files 與 task delta evidence
- [x] `.ai-run/` 改為執行產物，不納入版控
- [x] T01 smoke 路徑已跑通，planning -> local_exec -> review 可產出正式 evidence
- [x] T02 文件收斂：MVP 範圍、邊界、測試 gate、phase 順序已同步

### 進行中
- [ ] T03 前置準備：用文件收斂結果約束 `App.tsx` 拆分
- [ ] 將測試 gate 從文字標準變成真實測試保護
- [ ] 驗證 local_exec 在一般多檔案任務下的穩定性
- [ ] Creator Phase 1 文件落地與後台修復需依 `docs/CREATOR_ROADMAP.md` 執行

### 下一步
- [ ] 進入 T03，先抽離 `App.tsx` 的本地 UI state 與型別
- [ ] 然後再拆 sidebar / main content / overlays
- [ ] 之後才拆 `appStore.ts`

## 8. 目前結論
現在的 repo 還不能視為可發布產品，但已經從「邊做邊漂」進入「主線明確、phase 清楚、可開始穩定重構」的狀態。

## 9. Creator 最新修正（2026-03-29）
- [x] 修正 creator 設計頁與預覽頁 iframe 載入時序，避免 token 初始化丟失
- [x] 補上 preview 載入失敗可見錯誤提示，避免白屏無訊息
- [x] 修正 creator build 輸出與 hash 路由落地，避免 `/creator/` 與 callback 流程卡空白
- [x] 修正 preview base 路徑為 `/preview/`，避免 iframe 內資產 404
- [x] 修正 preview 缺少 `LocaleProvider` 導致 `useLocale` 崩潰
- [x] 已完成 `@toby/creator` lint/typecheck/test/build 與 `@toby/newtab` preview build
- [x] 已部署到 `https://tab-extension-gamma.vercel.app`

### 目前仍待追蹤
- [ ] creator 仍有 chunk 體積偏大告警（>500KB），屬效能優化項，非阻斷上線
- [ ] 舊版瀏覽器快取可能暫時看到過期 JS，需以硬重新整理驗證

<!-- T01_SMOKE_START -->
## T01 Smoke 驗證（自動更新）
- 狀態：已完成首輪 end-to-end smoke 驗證
- 驗證方式：由 run-ai-team.ps1 直接呼叫本地 Ollama API，確認 local model 可產生正式執行報告，再由 orchestration 寫入 task 級驗證紀錄
- 目前結論：planning -> local_exec smoke -> cloud_review 鏈路已可產生可審核 evidence
- 仍待後續驗證：多檔案修改 task、較長 prompt 與 revision flow 的穩定性
- Run log：C:\Users\eden\Documents\front-end\toby\.ai-run\run-log.txt
- 驗證時間：2026-03-28 21:02:00 +08:00
<!-- T01_SMOKE_END -->

<!-- T02_SCOPE_START -->
## T02 文件收斂（自動更新）
- 狀態：已完成
- 驗證方式：由 orchestration 直接驗證 MVP scope、deferred、架構邊界與測試 gate 文件，並同步更新 phase / blocker / next step
- 目前結論：MVP_SCOPE / ARCHITECTURE_BOUNDARIES / TEST_GATE / EXECUTION_PLAN / PROJECT_STATUS / DELIVERY_REPORT 已形成可執行基線，可直接支援下一階段 App.tsx 拆分
- 後續重點：進入 T03，先抽離 App.tsx 的本地 UI state 與型別
- 驗證時間：2026-03-28 21:02:48 +08:00
<!-- T02_SCOPE_END -->

<!-- T03_FREEZE_START -->
## T03 文件凍結（自動更新）
- 狀態：已完成
- 內容：已凍結 App.tsx / ppStore.ts 拆分順序與 placeholder 測試替換清單（見 EXECUTION_PLAN 與 TEST_GATE 的 T03 區塊）
- 下一步：進入 T04，開始抽離 pps/newtab/src/ui/App.tsx 的本地 UI state 與型別（不改行為）
- 更新時間：2026-03-28 21:03:30 +08:00
<!-- T03_FREEZE_END -->

<!-- T04_MAIN_CONTENT_START -->
## T04 Main Content Panel（手動更新）
- 狀態：已完成
- 內容：已新增 `apps/newtab/src/ui/app/MainContentPanel.tsx`，並將主內容區從 `App.tsx` 抽離（dock / 右側面板維持在 `App.tsx`）。
- 驗證：`pnpm --filter @toby/newtab lint`、`pnpm --filter @toby/newtab test`、`pnpm --filter @toby/newtab build`
- 下一步：T05 拆 overlays，或回到 SidebarPanel / shell state 的進一步拆分（依 EXECUTION_PLAN）。
- 更新時間：2026-03-28 10:45:00 +08:00
<!-- T04_MAIN_CONTENT_END -->














