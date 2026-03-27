# ARCHITECTURE_BOUNDARIES

最後更新：2026-03-28

## 1. 文件目的
這份文件不是畫大架構圖好看而已，而是用來約束後續拆 `App.tsx`、拆 `appStore.ts`、補 sync / membership / payment 測試時，哪些責任可以放一起，哪些責任必須切開。

本輪只接受有助於 MVP 穩定的邊界，不接受重新開新功能線。

## 2. 核心分層

### UI Layer
責任：
- React / Vue 畫面元件
- layout、panel、modal、popover
- 將資料轉成使用者可理解的操作畫面
- 將事件交給 application / service 層

禁止：
- 直接實作 sync 衝突解法
- 直接更新 membership / payment 狀態
- 直接碰 Supabase / webhook 狀態決策
- 直接知道 rollback 與 pending ops 細節

目前對應：
- `apps/newtab/src/ui/*`
- `apps/creator/src/*`

### Application Layer
責任：
- orchestration
- command handler
- 畫面與 domain / infrastructure 間的轉接
- 封裝 share / membership / sync facade

禁止：
- 把所有狀態與流程塞回單一 mega component
- 直接在 UI 元件中寫 API / auth / sync 細節

目前重整目標：
- `apps/newtab/src/ui/App.tsx`
- `apps/newtab/src/services/*`

### Domain Layer
責任：
- workspace / space / folder / collection / tab 規則
- move / reorder / restore / dedupe 等純規則
- membership vocabulary 與 entitlement 純邏輯

禁止：
- 依賴 React、Chrome API、Supabase client
- 依賴具體 UI 呈現

目前重整目標：
- `packages/core/src/store/*`
- `packages/core/src/utils/*`
- `packages/core/src/domain/*`（若後續需要）

### Infrastructure Layer
責任：
- chrome storage / local persistence
- service worker / message passing
- sync client
- Supabase API / Edge Functions / webhook
- payment provider 接線

禁止：
- 反向吞 UI 決策
- 在基礎設施層硬塞畫面狀態與商業流程文案

目前對應：
- `extension/*`
- `packages/api-client/*`
- `supabase/functions/*`

## 3. Extension Runtime 邊界
MVP 階段的 extension runtime 只需要清楚支持主線，不追求花俏。

### New Tab
- 主使用介面
- 讀取 local snapshot
- 顯示 sync 狀態
- 發出使用者操作命令

### Service Worker
- 接收 runtime 訊息
- 管理背景事件與必要的 auth / messaging glue
- 不負責畫面狀態

### Storage
- 本地 snapshot 是 MVP 的主要真實來源
- 使用者操作先寫本地，再決定同步
- 不可把 UI 狀態、同步狀態、商業資料全部揉成同一包模糊物件

## 4. 資料責任表

### Local snapshot
責任：
- workspaces / spaces / folders / collections / tabs
- local cache（selected ids、expanded ids、view mode、sort mode）
- pending ops
- rollback stack 所需資訊

原則：
- local-first
- 必須可 hydrate
- 必須支援失敗後的最小恢復能力

### Sync snapshot / sync metadata
責任：
- 上傳 / 拉取所需序列化資料
- sync 版本、重試、失敗紀錄
- failedIds / rollback / retry 相關資訊

原則：
- 只處理同步責任
- 不承擔 UI 文案責任
- 不承擔 billing / membership 責任

### Business metadata
責任：
- plan type
- membership 狀態
- trial / paid / expired / cancelled
- entitlement 起訖與 webhook 更新結果

原則：
- 與內容資料分離
- 不可混入 tab / collection snapshot
- 唯一 vocabulary 必須一致

## 5. `App.tsx` 拆分前提
`App.tsx` 下一階段只允許往下拆，不允許再長胖。

### App Shell 應保留
- 頂層資料組裝
- 子面板 props 傳遞
- 高階 orchestration
- route / preview / mode 判斷

### App Shell 不應保留
- 整段 sidebar 細節 JSX
- 整段 main content tab / collection 呈現 JSX
- membership / share / sync glue 散落在各段 handler
- modal / overlay 的具體渲染細節

## 6. `appStore.ts` 拆分前提
`appStore.ts` 應收斂為 state 初始化與 actions 組裝入口。

### 可拆出的模組
- hydrate / migration
- sync actions
- workspace actions
- collection actions
- tab actions
- dock actions
- rollback helper

### 不可接受狀態
- createAppStore 一檔承載所有流程與純規則
- store 直接知道 UI 元件細節
- store 直接內嵌 payment / membership 文案與 view state

## 7. Sync Boundary
MVP 階段的 sync 只需做到可追蹤、可重試、可回滾，不追求完整分散式協作。

### Sync 必須處理
- pending ops flush
- push / pull 的成功與失敗契約
- retry 時機
- rollback 所需資料
- lastSyncAt / lastSyncError / nextSyncRetryAt

### Sync 不應處理
- UI 文案與提示樣式
- payment / membership 狀態
- Creator / Theme Store 商業資料

## 8. Payment / Membership Boundary
這條線先求單純一致，不求完整商業化。

### 唯一狀態 vocabulary
- `trial_active`
- `paid_active`
- `paid_expired`
- `cancelled`

### 必須集中處理的地方
- webhook -> payment state mapping
- membership client -> entitlement read model
- gating helper -> 前台只讀結果

### 不可接受
- UI 自己推導 trial / paid / expired
- webhook 與 membership client 各自發明不同名稱
- entitlements 與內容 snapshot 混放

## 9. 本輪禁止事項
- 不為了 Creator / Theme Store 重新定義主產品架構。
- 不把 preview / creator 的需求壓回 newtab 主線。
- 不在沒有測試 gate 的情況下大改 sync。
- 不在文件還沒收斂前直接大拆 `App.tsx` / `appStore.ts`。

## 10. 下一步落點
1. 先完成文件基線與測試 gate。
2. 再拆 `App.tsx` 的 shell / sidebar / content / overlays。
3. 再拆 `appStore.ts` 的 hydrate / sync / actions。
4. 最後再整理 payment / membership 與真實測試。
