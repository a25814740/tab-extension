# EXECUTION_PLAN

最後更新：2026-03-28

## 執行原則
1. 先穩定自動執行框架，再讓它處理真實重構 task。
2. 一次只處理一個 task，review 通過才進下一個。
3. 先文件與邊界，再拆巨石，再補真測試，最後才碰 payment / membership 清理。
4. 不新增新的產品功能線，避免一邊重構一邊擴 scope。
5. 每一個 phase 完成後都要同步更新 `docs/PROJECT_STATUS.md` 與 `docs/DELIVERY_REPORT.md`。

## Phase 0：AI 執行框架收斂
### 目標
- 穩定 `run-ai-team.ps1`
- 讓 planning / local execution / cloud review 有可診斷 log
- 防止 local model 越界改 forbidden files

### 目前狀態
- 已完成 T01 smoke 驗證
- planning -> local_exec -> review 鏈路已可產出可審 evidence
- timeout / file gate / baseline dirty files / review normalization 已補齊

### 驗收標準
- script 可正確跑單一 task
- 失敗時可指出 provider / timeout / file gate / review parse 問題
- run log 與 review artifact 可作為下輪診斷依據

## Phase 1：MVP 文件與邊界收斂
### 目標
- 將 MVP / deferred / P0-P2 寫成唯一真實來源
- 把 extension runtime、sync、membership / payment 的責任邊界寫清楚
- 建立可執行的測試 gate

### 主要檔案
- `docs/MVP_SCOPE.md`
- `docs/PROJECT_STATUS.md`
- `docs/ARCHITECTURE_BOUNDARIES.md`
- `docs/TEST_GATE.md`
- `docs/EXECUTION_PLAN.md`
- `docs/DELIVERY_REPORT.md`

### 驗收標準
- 文件不再只有骨架句子
- Deferred 清單與目前主線一致
- 足以支援 `App.tsx` / `appStore.ts` 的拆分，不需要再猜責任
- 可明確回答哪些資料屬於 local snapshot、sync metadata、business metadata

### 本 phase 任務
- T02：收斂 MVP 文件並凍結 deferred scope

## Phase 2：拆 `App.tsx`
### 目標
- 讓 newtab UI 至少拆成 shell / sidebar / main content / overlays 四層
- 把本地 UI state、service glue 與大段 JSX 從單檔移出

### 主要檔案
- `apps/newtab/src/ui/App.tsx`
- `apps/newtab/src/ui/app/appTypes.ts`
- `apps/newtab/src/ui/app/useAppShellState.ts`
- `apps/newtab/src/ui/app/SidebarPanel.tsx`
- `apps/newtab/src/ui/app/MainContentPanel.tsx`
- `apps/newtab/src/ui/app/AppOverlays.tsx`
- `apps/newtab/src/services/*`

### 驗收標準
- `App.tsx` 行數顯著下降
- UI 邏輯分層清楚
- 不引入新功能
- sync / membership / share 不再散落在畫面巨石內

### 本 phase 任務
- T03：抽離 App Shell 本地狀態
- T04：拆出 Sidebar 與工作區樹 UI
- T05：拆出主要內容面板
- T06：拆出 overlays 與 facade

## Phase 3：拆 `appStore.ts`
### 目標
- 讓 `createAppStore()` 保持對外入口，但內部責任模組化
- 把 hydrate、sync、workspace / collection / tab / dock actions 從巨石拆開

### 主要檔案
- `packages/core/src/store/appStore.ts`
- `packages/core/src/store/hydrateState.ts`
- `packages/core/src/store/syncActions.ts`
- `packages/core/src/store/workspaceActions.ts`
- `packages/core/src/store/collectionActions.ts`
- `packages/core/src/store/tabActions.ts`
- `packages/core/src/store/dockActions.ts`

### 驗收標準
- `appStore.ts` 主要只剩 state 初始化與 action 組裝
- actions 模組不依賴 UI
- hydrate / rollback / sync 邏輯可被獨立測試

### 本 phase 任務
- T07：抽離 hydrate 與 sync helper
- T08：抽離 workspace / collection actions
- T09：抽離 tab / dock actions

## Phase 4：sync / membership / payment / tests 收斂
### 目標
- 把 sync 契約與 business vocabulary 收斂
- 將 placeholder 測試換成真流程 smoke / regression
- 建立 push 時可自動執行的 CI gate

### 主要檔案
- `packages/api-client/src/syncClient.ts`
- `packages/core/src/sync/syncEngine.ts`
- `packages/core/src/utils/membership.ts`
- `supabase/functions/payuni_webhook/*`
- `tests/integration/*`
- `tests/e2e/*`
- `.github/workflows/ci.yml`

### 驗收標準
- sync retry / rollback 有真實測試
- membership / payment 狀態 vocabulary 一致
- push 時會自動跑 lint 與核心測試

### 本 phase 任務
- T10：整理 sync contract 與真實整合測試
- T11：整理 payment / membership 狀態邊界
- T12：補齊 smoke / e2e / CI gate

## 暫不執行的內容
以下項目保持 deferred，不得插隊：
- Creator 商城完整化
- Theme Store / 分潤
- 模板商店
- 複雜多人協作
- 非 MVP 的視覺與商業擴充線

## 目前最近下一步
1. 完成 T02 文件型 task 驗證。
2. 進入 T03，先拆 `App.tsx` 的本地 UI 狀態與型別。
3. 只在文件與 gate 足夠時，才讓 local_exec 進入多檔案重構。
