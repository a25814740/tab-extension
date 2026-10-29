# PROJECT_STATUS

最後更新：2026-05-07

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
- `apps/newtab/src/ui/App.tsx` 仍偏大，尚未完成 shell / sidebar / overlays 的進一步拆分
- `packages/core/src/store/appStore.ts` 雖已抽出 hydrate / sync rollback 邊界，但 CRUD / reorder actions 仍偏重
- sync / membership / payment 的責任與 vocabulary 仍未完全收斂
- newtab / creator 已可 build 與驗證，但仍有 chunk 體積偏大告警

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
- 能建立 / 編輯 / 儲存草稿 / 公開上架主題
- 有作品列表與收益中心
- 收益中心可區分 live / fallback analytics
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
- sync boundary 與 business metadata boundary 還沒完全落成純函式 / facade
- Creator 雖已補齊草稿/上架/收益中心後台，且已補 payout ledger 顯示與付款回流頁，但 Theme Store 詳情頁與付款後前台刷新 UX 仍未完全收尾
- preview / creator 雖已補 smoke gate，但還缺更完整的互動回歸測試

## 6. Blockers
- [x] T01 已完成 smoke 驗證，AI orchestration 基本可用
- [x] T02 已將 MVP / deferred / 測試 gate / 邊界文件收斂成可執行版本
- [x] 已補上真實回歸保護：sync integration + preview smoke e2e
- [x] 已先守住 appStore 的 hydrate / sync rollback 責任界線
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
- [x] `packages/core/src/store/hydrateState.ts` 已抽出 hydrate / legacy migration 邏輯
- [x] `packages/core/src/store/syncActions.ts` 已抽出 rollback / flushPendingOps 邏輯
- [x] `tests/integration/syncFlow.test.ts` 已改為真實 sync 成功 / 失敗 / retry 流程
- [x] `tests/e2e/basic.test.ts` 已改為 preview smoke，並補 static server 驗證 build 輸出
- [x] 修正 preview runtime 在一般瀏覽器環境下的 `chrome is not defined` 問題
- [x] newtab / creator / tests / workspace lint + test + typecheck + build 全部通過
- [x] creator 後台已補齊草稿落庫 / 公開上架 / 下架回草稿 / 刪除作品
- [x] creator 作品列表、總覽、收益中心與設計頁已整理成可交付後台
- [x] 新增 `supabase/functions/creator_dashboard`，提供 creator 收益聚合的 server-side 邊界
- [x] `docs/CREATOR_ROADMAP.md` 已重寫為可執行版本，避免亂碼文件誤導後續 agent
- [x] `tests/e2e/creator.test.ts` 已補上 creator 匿名登入 gate smoke
- [x] Theme Store 前台已接上創作者公開主題、已購買 / 已安裝狀態與免費主題安裝套用
- [x] `payuni_checkout` 已支援 `membership` / `theme_asset` 兩種訂單型別
- [x] `payuni_webhook` 已支援把主題付款結果寫回 `theme_asset_purchases`
- [x] `creator_payout_ledger` migration 已補上，先建立人工月結的資料底板
- [x] `docs/THEME_STORE.md` 已重寫為可執行版本，補齊 Theme Store 與 Creator / Payment 邊界
- [x] `apps/newtab/src/services/themeStore.test.ts` 已補上 Theme Store helper 單元測試
- [x] Creator 收益中心已補上 `creator_payout_ledger` 台帳視圖
- [x] `payuni_return` 已補成可用回流頁，支援導回 Creator 或指定入口
- [x] Supabase production 已完成 `creator_dashboard` / `payuni_checkout` / `payuni_webhook` 部署
- [x] Supabase production 已完成 `creator_payout_ledger` 與 theme purchase index migrations

### 進行中
- [ ] T03 / T04 後續：把 `App.tsx` 再拆成 sidebar / overlays / shell state
- [ ] 將 `appStore.ts` 的 workspace / collection / tab / dock actions 進一步模組化
- [ ] 驗證 local_exec 在一般多檔案任務下的穩定性
- [ ] Theme Store 付款完成後的前台自動刷新、詳情頁與購買後 UX 補強
- [ ] creator 真實收益與 payout 台帳的實資料驗證

### 下一步
- [ ] 先拆 `App.tsx` 的 sidebar / overlays / shell state
- [ ] 再拆 `appStore.ts` 的 workspace / collection / tab / dock actions
- [ ] 補 Theme Store 詳情頁與付款成功後的回流體驗
- [ ] 補 payout ledger 人工月結流程與後台操作 SOP
- [ ] 補 Theme Store 詳情頁與付款後前台刷新 UX
- [ ] 最後補 membership / payment / creator smoke

## 8. 目前結論
現在的 repo 已經從「文件有了但保護不夠」進入「有真實測試 gate、可持續重構」的狀態；主線穩定性顯著提升，但 `App.tsx` / `appStore.ts` 還沒拆到理想邊界，尚不算完全完成。

## 10. 2026-05-04 本輪交付
- [x] `appStore` 抽出 hydrate / sync rollback / retry 邏輯
- [x] preview build 入口補 smoke e2e 與靜態驗證 server
- [x] 修正 preview / creator 共用 runtime 對 `chrome` 全域的脆弱依賴
- [x] 重整 `MainContentPanel` 型別，讓 newtab typecheck 恢復綠燈
- [x] 驗證：
  - `pnpm lint`
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm --filter @toby/newtab build`
  - `pnpm --filter @toby/newtab build:preview`
  - `pnpm --filter @toby/creator build`
  - `pnpm --filter @toby/tests test:e2e`

## 11. 2026-05-07 Creator 可販售基線
- [x] Creator 後台改成可用的總覽 / 作品列表 / 收益中心結構
- [x] 草稿儲存會真實寫回 `theme_assets`
- [x] 公開上架與下架回草稿有完整狀態線
- [x] 作品刪除、價格、分潤比例、標籤、預覽封面管理可用
- [x] 收益中心先走 `creator_dashboard` live analytics，失敗時退回 fallback 模式
- [x] Theme Store 前台可讀取公開主題、辨識已購買 / 已安裝狀態
- [x] 免費主題可直接安裝並套用
- [x] 付費主題可透過 PAYUNi 建立 theme asset checkout
- [x] PAYUNi webhook 成功後可回寫 `theme_asset_purchases`
- [x] Creator 收益中心可顯示 payout ledger 台帳資料
- [x] PAYUNi return 頁面已有實際可用的回流頁與導向設定
- [x] `pnpm --filter @toby/creator lint`
- [x] `pnpm --filter @toby/creator typecheck`
- [x] `pnpm --filter @toby/creator test`
- [x] `pnpm --filter @toby/creator build`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm --filter @toby/newtab test`
- [x] `pnpm --filter @toby/newtab build:preview`
- [x] `pnpm --filter @toby/tests test:e2e`

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

## 2026-10-29：sync_ops workspace 授權
- [x] `sync_ops` 在套用每個 op 前檢查 workspace 寫入權限（owner / admin / editor），修正任何登入使用者可改他人資料的漏洞
- [x] 資料庫錯誤不再被誤報為 `syncedIds`
- [x] 新增 `tests/integration/syncOpsAuthorize.test.ts`（10 個案例）
- 阻塞：正式環境部署需使用者確認
