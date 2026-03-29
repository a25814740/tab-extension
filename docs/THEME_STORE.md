# Theme Store / Template Store（第一版）

## 目的
- 提供使用者在擴充套件內直接切換主題與模板。
- 預留創作者上架與分潤機制（平台抽成 + 作者收益）。
- 與現有方案系統（membership / payment）共用商業資料層。

## 前端現況（已實作）
- 帳號選單新增 `主題商店` 入口。
- 商店分兩頁：
  - 主題（Theme）
  - 模板（Template）
- 支援：
  - 套用官方/社群預設主題
  - 套用官方/社群模板
  - 自訂配色（背景、面板、邊框、文字、強調色）
  - 自訂背景樣式：支援純色、漸層、背景圖片（`url(...)`）
  - 左側欄 / 主內容 / 右側欄 可分別配置不同背景
- 本機保存 key：`toby_theme_store_v1`

## 設定資料格式
- JSON Schema：`docs/theme-store.schema.json`
- 前端 catalog：`apps/newtab/src/theme/catalog.ts`

## 資料庫設計（本次 migration）
- `theme_assets`
  - 存放主題或模板資產（theme / template）
  - 支援官方與創作者資產
  - 含價格、分潤比例、config JSON
- `theme_asset_purchases`
  - 用戶購買紀錄
- `theme_asset_installs`
  - 用戶安裝/啟用紀錄（可對 workspace 套用）

## 分潤邏輯建議（下一階段）
- `theme_assets.revenue_share_percent` 表示作者分潤比例。
- 付款成功後：
  1. 寫入 `theme_asset_purchases`
  2. 寫入對帳事件（可延伸到既有 `payment_events`）
  3. 寫入作者分潤 ledger（建議新表 `creator_payout_ledger`）
- `creator_payout_ledger` 先只記帳，不直接代表已匯款。
- `payout` 須與收款分離，避免把收單 provider 當成多創作者分帳工具。

## 上架位置與營運建議（回答產品問題）
### 主題商店要上架在哪裡
- 前台入口：擴充套件內 `主題商店`（你現在這個 UI 就是前台）。
- 後台入口：新增 Creator Portal（建議用 Vercel 網站），供設計者登入後提交：
  - 資產名稱、封面、預覽圖
  - Theme JSON（含 light/dark tokens）
  - 價格、分潤比例、版本說明
- 審核通過後，寫入 `theme_assets`，前台商店自動讀到可販售項目。
- 第一版路徑：`/creator/index.html`
  - 範例：`https://tab-extension-gamma.vercel.app/creator/`

### 設計者如何收取收益
- 第一版建議：平台代收，平台結算，平台人工或批次匯款給創作者。
- 資料流建議：
  1. 使用者付款成功（PAYUNi webhook）
  2. 建立 `theme_asset_purchases`
  3. 依 `revenue_share_percent` 計算作者可分潤金額
  4. 寫入 `creator_payout_ledger`（待結算）
  5. 月結匯款到創作者預先綁定的銀行帳戶
  6. 結算完成後標記為已支付
- 若未來要自動匯款，才需要另外串接銀行轉帳或 payout provider 的 API。
- 平台抽成建議：
  - 官方主題：平台 100%
  - 創作者主題：平台 30% / 設計者 70%（可在 `revenue_share_percent` 調整）

### 最小可行版本（MVP）
- 先不上模板商店（你已指定暫不提供模板版型）。
- 只開 Theme 上架 + 購買 + 安裝 + 套用 + 分潤對帳。
- 分潤先做「月結手動匯款」，等交易量穩定再自動化。

## 後續待做
- 接 API：商店資產列表、購買、安裝、上架
- 資產審核流程（內容檢查、版權、惡意樣式）
- 創作者後台（上架、更新版本、收益查詢）
- 與 `docs/CREATOR_ROADMAP.md` 對齊 Phase 1 / 2 / 3
