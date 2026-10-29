# MVP_SCOPE

最後更新：2026-03-29

## 1. MVP 主線定義
Taboard 在 MVP 階段的唯一主線，是交付一個可穩定使用的 Chrome 新分頁分頁管理工具。這個工具必須先把本地資料正確性、主要操作流程與最低限度同步能力做穩，再談 Creator、主題商店、分潤與商業化包裝。

MVP 成功不等於功能很多，而是代表以下三件事成立：
- 使用者可以在新分頁穩定管理 workspace / space / collection / tab。
- 本地資料可持久化，重開瀏覽器後資料不亂掉。
- 基本同步流程可用，失敗時至少可追蹤、可重試、可避免靜默毀損。

## 2. MVP 必含能力

### P0：必須先成立，否則不可往下拆
- 主線收斂，文件明確寫出哪些功能不做。
- `apps/newtab/src/ui/App.tsx` 與 `packages/core/src/store/appStore.ts` 的重構前提與邊界清楚。
- extension runtime、sync、membership / payment 的責任分層已定義，不再模糊混用。
- 測試 gate 有最低標準，不能再用 placeholder 充數。

### P1：MVP 核心功能
- workspace / space / collection 基本建立、切換、重命名、刪除。
- tab 基本新增、移動、排序、刪除、恢復、去重。
- local-first 資料持久化與 hydrate。
- new tab 主操作介面可正常使用。
- 至少一條可驗證的同步主流程。
- 最低限度的錯誤顯示與重試資訊。

### P2：MVP 必要但排在核心穩定之後
- `App.tsx` 拆成 shell / sidebar / main content / overlays。
- `appStore.ts` 拆成 hydrate、sync、workspace/collection/tab/dock actions。
- sync retry / rollback 測試補成真實流程。
- membership / payment vocabulary 收斂，避免 entitlement 邏輯散落。
- CI 至少能在 push 時跑 lint 與核心測試。

## 3. Deferred：明確延後，不可偷渡進主線
下列項目一律不屬於目前 MVP，除非文件先重新收斂並明確升級優先序，否則不得在重構途中重新打開。

### 商業化延後
- Creator 商城完整上架流程
- Theme Store 與主題分潤
- 創作者收益結算
- 進階方案頁包裝與商業後台擴充

### 協作延後
- 複雜多人協作
- 細緻角色權限矩陣
- 即時多人編輯 / presence / comment 流程

### 視覺與擴充延後
- 模板商店
- 非必要主題編輯擴充線
- 高自由度版型系統
- 與 MVP 無關的 Creator UI 美化

## 4. Creator Roadmap（非 MVP）
Creator 與 Theme Store 不是 MVP 主線，但它們是產品商業化路線，需依文件分期，不得直接插入主線。

### Phase 1
- creator 後台穩定登入
- preview 與前台一致
- 主題建立 / 編輯 / 發佈可用
- 不做模板商店
- 不做自動 payout

### Phase 2
- 受控 Theme Store 上架
- 購買 / 套用 / 安裝
- 分潤 ledger
- 月結人工匯款

### Phase 3
- marketplace 自動結算
- 模板商店評估
- 多創作者與曝光機制

### 分潤原則
- PAYUNi 先處理收款
- 平台自行記帳與結算
- 創作者款項先走人工或批次匯款
- 自動 payout 只有在有明確 provider / API / 商務條款時才啟用

## 4. 邊界說明

### 內容資料
以下屬於產品主體資料：
- workspaces
- spaces
- folders
- collections
- tabs
- local app cache

這些資料的優先順序是：本地正確性 > UI 完整包裝 > 商業功能延伸。

### 同步資料
以下屬於同步責任：
- pending ops
- snapshot 版本資訊
- retry / rollback 所需 metadata
- sync error / lastSyncAt / next retry

同步資料不是 UI 功能，也不是 billing metadata，不應混進前端畫面元件中直接決策。

### 商業資料
以下屬於 business metadata：
- membership
- entitlement
- trial / paid / expired / cancelled
- payment webhook 更新結果

這些資料不是 MVP 第一優先，只能在核心穩定後再清理與補測。

## 5. 禁止事項
- 不可在 MVP 收斂前新增新的產品功能線。
- 不可把 Creator / Theme / Billing 的需求混進 `App.tsx` 拆分任務。
- 不可因為商業想像而擴大 manifest、sync、backend 複雜度。
- 不可把 placeholder 測試當成完成。
- 不可把 payment / entitlement 判斷散落到 UI 與 store 多處。

## 6. 目前接受的交付標準
以下條件成立，才可宣稱 MVP 主線已具備可交付基礎：
- 新分頁主操作流程穩定。
- 本地資料可持久化且 hydrate 正常。
- 至少一條同步主流程與失敗重試機制可驗證。
- `App.tsx` 與 `appStore.ts` 不再是無邊界巨石。
- 測試 gate 能阻止核心流程壞掉仍被視為可發布。

## 7. 本輪實作順序
1. 收斂 MVP 文件與 deferred 清單。
2. 補 extension runtime / sync / membership-payment 邊界文件。
3. 拆 `App.tsx`。
4. 拆 `appStore.ts`。
5. 補真實 smoke / regression 測試。
6. 最後才整理 payment / membership 與商業化後台。
