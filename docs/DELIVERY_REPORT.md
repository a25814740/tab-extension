# DELIVERY_REPORT

最後更新：2026-05-07

## 本輪目標
- 補齊真實測試 gate，取代 placeholder
- 抽出 `appStore` 的 hydrate / sync rollback 邊界
- 修正 preview / creator 共用流程中的 runtime 問題
- 讓 newtab / creator / tests / workspace 回到可驗證綠燈
- 把 creator 後台補成可販售前的基礎版本（草稿 / 上架 / 收益中心）

## 已完成
- [x] 新增 `packages/core/src/store/hydrateState.ts`
- [x] 新增 `packages/core/src/store/syncActions.ts`
- [x] `packages/core/src/store/appStore.ts` 已改為委派 hydrate / rollback / flushPendingOps
- [x] `tests/integration/syncFlow.test.ts` 取代 placeholder，驗證 sync 成功 / server failed / network retry
- [x] `tests/e2e/basic.test.ts` 改為 preview smoke，並加入 `tests/scripts/serve-static.mjs`
- [x] 修正 preview / creator runtime 對 `chrome` 全域變數的脆弱依賴
- [x] 重整 `apps/newtab/src/ui/app/MainContentPanel.tsx`，修正 view/sort/droppable 型別漂移
- [x] `pnpm lint`、`pnpm test`、`pnpm typecheck` 全部通過
- [x] `pnpm --filter @toby/newtab build`
- [x] `pnpm --filter @toby/newtab build:preview`
- [x] `pnpm --filter @toby/creator build`
- [x] `pnpm --filter @toby/tests test:e2e`
- [x] 重寫 creator 後台頁面：`Dashboard / Assets / Revenue / Design / Preview`
- [x] `apps/creator/src/store/creatorStore.ts` 已補齊草稿落庫、公開上架、下架回草稿、刪除作品與 fallback analytics
- [x] 新增 `supabase/functions/creator_dashboard/index.ts`
- [x] 重寫 `docs/CREATOR_ROADMAP.md`
- [x] 新增 `tests/e2e/creator.test.ts`，補齊 creator 匿名登入 gate smoke
- [x] 重寫 `docs/THEME_STORE.md`，補齊 Theme Store / Creator / Payment / payout 邊界
- [x] Theme Store 前台已接上公開主題、已購買 / 已安裝狀態、免費安裝套用
- [x] `payuni_checkout` 已支援 `theme_asset` checkout
- [x] `payuni_webhook` 已支援回寫 `theme_asset_purchases`
- [x] 新增 `supabase/migrations/202605070003_creator_payout_ledger.sql`
- [x] 新增 `apps/newtab/src/services/themeStore.test.ts`
- [x] creator 收益中心已補上 `creator_payout_ledger` 台帳顯示
- [x] `payuni_return` 已補成可用回流頁，支援導回 Creator 或指定入口
- [x] Supabase production 已完成 `creator_dashboard` / `payuni_checkout` / `payuni_webhook` 部署
- [x] Supabase production 已完成 theme purchase index / `creator_payout_ledger` migrations

## 本輪產出
### 文件
- `docs/MVP_SCOPE.md`
- `docs/PROJECT_STATUS.md`
- `docs/ARCHITECTURE_BOUNDARIES.md`
- `docs/TEST_GATE.md`
- `docs/EXECUTION_PLAN.md`
- `docs/DELIVERY_REPORT.md`

### 執行框架
- `run-ai-team.ps1`
- `.ai-run/*` evidence / review / run log

## 目前仍在進行
- [ ] 將文件型規則真正落到 `App.tsx` sidebar / overlays / shell state 拆分
- [ ] 將 `appStore.ts` workspace / collection / tab / dock actions 繼續模組化
- [ ] 收斂 sync / membership / payment vocabulary 與狀態轉換
- [ ] Theme Store 詳情頁與付款完成後前台自動刷新 UX
- [ ] creator 收益中心的真實 payout 台帳資料驗證
- [ ] payout ledger 與人工月結 SOP 尚未落地

## Blockers / 風險
- `App.tsx` 與 `appStore.ts` 仍是主技術債；這輪是先把保護網補起來，不是最終拆分
- preview / creator / newtab build 都有 chunk 體積偏大告警，屬非阻斷但需後續處理
- Creator / Theme / Billing 仍有吸走注意力的風險，必須持續維持 deferred

## 下一步
1. 拆 `App.tsx` 的 sidebar / overlays / shell state
2. 再拆 `appStore.ts` 的 workspace / collection / tab / dock actions
3. 補 Theme Store 詳情頁與付款完成後前台刷新 UX
4. 驗證 creator live analytics / payout ledger 真實資料
5. 補 membership / payment 的真實測試
6. 若 task 觸及 creator / theme / payout，先對齊 `docs/CREATOR_ROADMAP.md` 的 Phase 1/2/3

## 是否可交付
- [ ] 尚未可視為所有功能全部完工
- [x] 可作為內部穩定重整基線
- [x] 可供目前分支持續驗證 newtab / creator / preview 主流程

## Creator 穩定化交付（2026-03-29）
### 已完成
- [x] 設計頁/預覽頁改為正確的 iframe lifecycle 管理（含 `onUnmounted` 清理）
- [x] 加入 preview 載入逾時提示，避免使用者只看到空白
- [x] 修正 preview 站點資產路徑，避免 `/preview/` 404
- [x] 修正 preview 缺少 `LocaleProvider` 的 runtime crash
- [x] 修正 creator hash callback 兼容，降低 OAuth 回跳白屏機率
- [x] 完整驗證：
  - `pnpm --filter @toby/creator lint`
  - `pnpm --filter @toby/creator typecheck`
  - `pnpm --filter @toby/creator test`
  - `pnpm --filter @toby/creator build`
  - `pnpm --filter @toby/newtab build:preview`
- [x] 已部署與 alias：
  - Production deployment: `https://tab-extension-7ltwva1j4-a25814740s-projects.vercel.app`
  - Alias: `https://tab-extension-gamma.vercel.app`

### Blockers
- 無阻斷 deployment 的 blocker；目前主要剩瀏覽器快取與非阻斷體積優化議題。

### 下一步
1. 以無痕或硬重新整理驗證 creator 登入回跳與 `/creator/#/design` 行為。
2. 若仍有空白頁，先清除 Service Worker/快取後再驗證，避免舊資產干擾。
3. 進入 creator 功能層（作品列表/收益頁）的真實資料整合與錯誤回復流程。

## Creator 可販售基線交付（2026-05-07）
### 已完成
- [x] Creator 後台總覽改為可閱讀的商業化 dashboard
- [x] 作品列表可編輯 / 預覽 / 下架 / 刪除 / 新增
- [x] 設計頁的「儲存草稿」已改成真正寫回資料庫
- [x] 公開上架與草稿狀態已分離，不再只有單一儲存路徑
- [x] 收益中心支援 live analytics 與 fallback analytics 兩種模式
- [x] 新增 `creator_dashboard` Edge Function 作為 creator 收益聚合邊界
- [x] 新增 creator 匿名登入 gate smoke，避免後台 build 成功卻白屏
- [x] Theme Store 前台可顯示創作者公開主題與已購買 / 已安裝狀態
- [x] 免費主題可直接安裝與套用
- [x] 付費主題可建立 PAYUNi checkout，並在 webhook 成功後回寫購買狀態
- [x] 驗證：
  - `pnpm --filter @toby/creator lint`
  - `pnpm --filter @toby/creator typecheck`
  - `pnpm --filter @toby/creator test`
  - `pnpm --filter @toby/creator build`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm --filter @toby/newtab test`
  - `pnpm --filter @toby/newtab build:preview`
  - `pnpm --filter @toby/tests test:e2e`

### 仍待補齊
- [ ] Theme Store 詳情頁與付款後前台刷新 UX 還沒補齊
- [ ] 撥款 ledger 與人工月結 SOP 尚未進入可操作後台

<!-- T01_SMOKE_START -->
## T01 Smoke 驗證紀錄（自動更新）
- 狀態：已完成
- 驗證內容：local model 可回傳正式 markdown 執行報告，且 task evidence 已包含實際文件 delta、scope gate 與 forbidden gate 證據
- 本次限制：這一輪只驗證 AI 執行框架的首個 smoke task，不代表後續重構 task 已全部穩定
- 後續重點：把下一個文件型 task 跑通，再驗證真正的檔案修改流程
- Run log：C:\Users\eden\Documents\front-end\toby\.ai-run\run-log.txt
- 驗證時間：2026-03-28 21:02:00 +08:00
<!-- T01_SMOKE_END -->

<!-- T02_SCOPE_START -->
## T02 文件收斂紀錄（自動更新）
- 狀態：已完成
- 驗證內容：已把 MVP 主線、deferred、架構邊界、測試 gate 與 phase 順序收斂成單一依據
- 本次限制：目前仍屬文件基線完成，不代表 App.tsx / ppStore.ts 已拆完
- 後續重點：依文件基線直接進入 T03 拆分 App.tsx
- 驗證時間：2026-03-28 21:02:48 +08:00
<!-- T02_SCOPE_END -->

<!-- T03_FREEZE_START -->
## T03 文件凍結紀錄（自動更新）
- 狀態：已完成
- 內容：補齊 App.tsx 與 ppStore.ts 的拆分順序與測試替換順序，避免後續重構時 scope 漂移
- 下一步：T04 抽離 App shell state 與型別
- 更新時間：2026-03-28 21:03:30 +08:00
<!-- T03_FREEZE_END -->

<!-- T04_MAIN_CONTENT_START -->
## T04 Main Content panel（手動更新）
- 狀態：已完成
- 內容：新增 `apps/newtab/src/ui/app/MainContentPanel.tsx`，並將 newtab 主內容區（collection / tab 列表與空白 drop 區）自 `App.tsx` 抽離。
- 驗證：
  - `pnpm --filter @toby/newtab lint`（pass）
  - `pnpm --filter @toby/newtab test`（passWithNoTests）
  - `pnpm --filter @toby/newtab build`（pass）
- 備註：為了逐 task 推進，`App.tsx` 內仍保留部分「下一階段要再拆的 helper」，以 `void <name>` 方式先避免 eslint 阻斷；後續會在 T05/T06 逐步消掉。
- 更新時間：2026-03-28 10:45:00 +08:00
<!-- T04_MAIN_CONTENT_END -->















