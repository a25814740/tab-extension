# UI Refactors (Post v0.3)

本文件記錄 v0.3 已完成後，仍可在不改變 UI 規格的前提下逐步改善的結構性整理點。

## 元件拆分
- 將 `App.tsx` 拆成：
  - `LeftSidebar`
  - `CenterWorkspace`
  - `RightSidebar`
  - `DockBar`
  - `Toolbar`
  - `ModalManager`
- 把 Dock 區塊獨立成可重用的 section 元件，避免重複的 tooltip / icon 佈局。

## 狀態與動作
- 把 `App.tsx` 內的事件處理集中到 hooks（例如 `useDockActions`, `useSpaceActions`, `useTabBatchActions`）。
- 將 space/collection/tab 的操作分層，避免跨區塊互相依賴的邏輯。

## 型別與資料
- 統一 UI 層的 `uiTab` / `tab` 命名，減少 domain / UI 型別混用。
- Dock item 顯示資料與實際儲存資料分離（例如 UI 層擴充字段不要進入持久層）。

## 樣式與結構
- 減少過長 className 串，必要時抽成 `clsx` + `styles`。
- 將 sidebar / dock 的 layout class 抽成共用常數，避免偏差。

## 測試與回歸
- 補 Dock/Sidebar 最小互動快照測試。
- 建立 tab 多選/批次操作的最小 e2e case。
