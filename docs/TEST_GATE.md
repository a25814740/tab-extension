# TEST_GATE

最後更新：2026-03-28

## 1. 文件目的
這份文件定義什麼叫做「可相信的測試 gate」。MVP 階段的目標不是追求測試數量，而是讓最容易壞、最影響資料正確性與可交付性的流程，有真實的 smoke 與 regression 保護。

## 2. Gate 分級

### Level 0：不可再接受的假測試
以下內容不算測試，只算占位：
- `expect(true).toBe(true)` 類 placeholder
- 不觸及真實狀態流的空測試
- 只驗證檔案存在、不驗證流程結果的假整合測試

處理原則：
- 要嘛刪掉
- 要嘛標記待補
- 不可再被算進 release gate

### Level 1：MVP Smoke Gate
每次重構前後至少要能證明：
- 專案可 build / lint
- newtab 主畫面可載入
- 基本 workspace / collection / tab 主流程不會立刻爆掉
- extension / preview 至少有一條可載入 smoke

### Level 2：Regression Gate
重點保護真正會壞資料的流程：
- workspace / collection create / rename / delete
- tab move / reorder / restore / dedupe
- local snapshot hydrate
- sync retry / rollback
- membership gating
- payment webhook -> entitlement update

### Level 3：Non-blocking
以下可以延後，不作為 MVP 阻擋條件：
- 細節 UI 樣式
- 非主線 creator 流程
- Theme Store / 分潤 / 模板商店
- 實驗性互動與視覺細節

## 3. 最低必過條件
在目前階段，若下列任一條未成立，不得視為可交付：
- `pnpm lint` 通過
- newtab 可 build
- workspace / collection / tab 核心流程至少有可相信的 smoke 或單元保護
- local persistence / hydrate 至少有一條真流程測試
- sync 至少一條主流程測試，不可全靠手動信仰
- membership / payment entitlement 至少有一條狀態轉換測試

## 4. 測試責任對照

### `apps/newtab`
應優先補：
- 畫面載入 smoke
- App shell 拆分後的行為不變驗證
- sidebar / content / overlays 的主要交互 smoke

### `packages/core`
應優先補：
- appStore hydrate
- workspace / collection / tab actions
- rollback / retry / dedupe 純邏輯
- membership vocabulary helper

### `packages/api-client` / `packages/core/src/sync`
應優先補：
- sync client 成功 / 失敗契約
- retry / rollback 整合流程
- failedIds / pending ops 的處理

### `supabase/functions`
應優先補：
- payment webhook -> entitlement state mapping
- share link / membership update 的最小回歸測試

## 5. 現在已知的測試缺口
- 部分整合 / e2e 仍可能存在 placeholder 或低信任度案例。
- syncFlow 需要從假的 smoke 補成真實 retry / rollback 驗證。
- membership / payment 狀態轉換缺少統一 vocabulary 與對應測試。
- `App.tsx` / `appStore.ts` 拆分前尚未建立足夠的回歸保護。

## 6. 本輪測試優先序
1. `pnpm lint`
2. newtab build smoke
3. appStore / sync engine 核心測試
4. sync retry / rollback 整合測試
5. membership / payment 狀態轉換測試
6. e2e smoke（newtab / extension 載入）

## 7. 禁止事項
- 不可用 placeholder 冒充 regression。
- 不可只測 happy path 就宣稱流程穩定。
- 不可在關鍵狀態轉換完全沒測的情況下重構主線。
- 不可把 Creator / Theme Store 的 UI 測試優先於 MVP 主產品核心測試。

## 8. 與重構的關係
這一輪測試 gate 的功能，是保護以下重構：
- `apps/newtab/src/ui/App.tsx` 拆分
- `packages/core/src/store/appStore.ts` 拆分
- sync boundary 收斂
- membership / payment vocabulary 收斂

如果沒有這份 gate，後續任何「看起來可編譯」的改動都不值得信任。

## 9. 本輪執行紀錄
- 2026-03-28：T02 文件收斂階段，先將測試 gate 寫成可執行標準，下一階段再用它約束 App.tsx / appStore.ts 拆分與 sync/payment 測試補齊。

<!-- T03_PLACEHOLDER_START -->
## T03 重構順序（凍結）

### App.tsx 拆分順序（固定）
1. shell state / 型別 / hook（先抽出，避免後續面板拆分時再補洞）
2. sidebar（workspace / space / folder / collection tree）
3. main content（collection / tab 主內容）
4. overlays（share / pricing / settings 等 modal 與 facade）

### ppStore.ts 拆分順序（固定）
1. hydrate / migration（state 還原與版本遷移）
2. sync actions / flush pending ops（推拉與 retry/rollback glue）
3. workspace / collection actions（CRUD + 排序）
4. tab / dock actions（move/reorder/dedupe/dock）

### Placeholder / 低信任測試命中（待替換清單）
- tests/e2e/basic.test.ts:3: test("basic e2e placeholder", async ({ page }) => {
- tests/integration/syncFlow.test.ts:4: it("placeholder integration test", () => {

更新時間：2026-03-28 21:03:30 +08:00
<!-- T03_PLACEHOLDER_END -->







