# CREATOR_ROADMAP

最後更新：2026-05-07

## 1. 定位
Creator 後台是 Taboard 的第二階段商業化基礎，不屬於 MVP 主線，但它必須維持可獨立交付、可持續擴充。

這條線的責任很單純：
- 讓創作者能建立、編輯、儲存、預覽、上架主題
- 讓平台端能逐步補齊收益統計、購買安裝、人工撥款 SOP
- 不在這一階段硬上模板商店、自動撥款、多租戶營運後台

## 2. 現在的真實狀態
### 已完成
- Creator OAuth 登入與 hash callback 基礎流程
- `/creator/#/` Hash Router 與 `/preview/` iframe 預覽流程
- 主題草稿 / 公開上架資料落庫（`theme_assets`）
- 主題設計頁與前台 preview tokens 串接
- Creator 基本後台頁：總覽 / 作品列表 / 收益中心 / 設計 / 預覽
- `creator_dashboard` Edge Function 規劃與前端 fallback analytics 機制
- Theme Store 前台已接上公開主題、已購買 / 已安裝狀態
- 免費主題可直接安裝並套用
- 付費主題可建立 PAYUNi checkout，並由 webhook 回寫購買狀態
- `creator_payout_ledger` schema 已落地，先提供人工月結資料底板
- Creator 收益中心已可顯示 payout ledger 台帳資料
- `payuni_return` 已提供可用回流頁，可導回 Creator 或指定入口

### 尚未完成
- Theme Store 詳情頁與付款後前台刷新 UX
- 真實收益 ledger 與人工撥款名單整理
- 自動撥款 / payout API
- 模板商店
- 創作者審核、評分、推薦、活動機制

## 3. 資料邊界
### 前台可直接查
- `theme_assets`
  - 創作者本人可讀自己的主題
  - 使用者可讀 `is_public` 或 `is_official` 的主題
- `theme_asset_purchases`
  - 使用者只能讀自己的購買紀錄
- `theme_asset_installs`
  - 使用者只能讀自己的安裝紀錄

### 前台不可直接查
- 真實創作者收益聚合結果
- payout ledger
- 撥款狀態與人工對帳資料

原因：
- 目前 RLS 設計是 buyer / installer self access
- Creator 想看真實收益時，必須走 server-side aggregation
- 收益中心不能只靠前端直查資料表硬湊數字

### 目前解法
- 前端優先呼叫 `creator_dashboard` Edge Function
- 若 function 尚未部署或不可用，退回 fallback analytics
- fallback 僅顯示作品數、草稿數、公開數，不假裝有真實營收

## 4. 商業化拆階段
### Phase 1：Creator 可上架
目標：讓創作者可以真的做出一個主題並公開上架

必須完成：
- 登入
- 作品列表
- 新增設計 / 編輯設計
- 草稿落庫
- 公開上架 / 下架回草稿
- 預覽圖上傳或自動截圖
- 預覽頁可用
- 收益中心至少能區分 live / fallback

不做：
- 自動撥款
- 模板商店
- 平台活動機制

### Phase 2：Theme Store 可交易
目標：讓使用者能在前台看到、購買、安裝主題

必須完成：
- Theme Store 前台列表
- 主題詳情頁
- 付款流程串接
- 安裝記錄
- 購買紀錄
- creator_dashboard 真實收益聚合穩定可用
- 人工月結撥款流程文件化

目前進度：
- 前台列表：已完成
- 付款流程串接：已完成 checkout / webhook / return 基礎
- 安裝記錄：已完成
- 購買紀錄：已完成基本回寫
- 尚缺：詳情頁、付款後前台刷新 UX、收益驗證

### Phase 3：平台化營運
目標：把創作者與平台分潤做成可管理、可規模化

候選項：
- payout ledger
- 匯款後台
- 創作者申請 / 審核
- 推薦與活動曝光
- 模板商店評估

## 5. 撥款策略
目前建議：
- 先走人工月結
- 平台主帳號依 ledger 匯款到創作者提供的金融帳戶
- 匯款完成後，再把 payout 狀態寫回 ledger

原因：
- 付款成功不代表可以立刻撥款
- 退款、爭議款、稅務、手續費都需要後處理
- 一開始硬串 payout API，風險比收益高很多

## 6. PAYUNi 的角色
PAYUNi 目前定位：
- 處理買家付款
- 回傳付款結果給平台
- 不直接處理創作者分潤撥款

這代表：
- PAYUNi 並不能取代 creator payout ledger
- 真正撥款給創作者，仍需平台端的會計流程或未來接 payout provider

## 7. 工程原則
1. Creator 任務不能破壞 newtab 主線穩定性
2. 收益數字若不是 server-side 聚合，不得假裝是真實營收
3. 任何 payout / ledger / 稅務邏輯，都必須與 UI 分層
4. 若缺少金流或 service role 環境變數，先挖洞、先 fallback，不要硬寫死
5. Creator 所有頁面都要可 build、可 typecheck、可 preview

## 8. 當前下一步
1. Theme Store 詳情頁與付款完成後前台刷新 UX
2. creator_dashboard / payout ledger 真實收益驗證
3. 月結 SOP 與 payout 後台操作流程
