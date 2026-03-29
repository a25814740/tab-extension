請把目前專案拆成可連續自動完成的任務鏈。

限制：
- 只做 MVP 收斂、巨石拆分、邊界整理、真實測試補齊
- 不新增功能線
- 優先順序必須符合：
  1. 收斂 scope
  2. 拆 apps/newtab/src/ui/App.tsx
  3. 拆 packages/core/src/store/appStore.ts
  4. 整理 sync / payment / membership 邊界
  5. 補核心流程真實測試
- 每個 task 要適合本地 qwen2.5-coder:14b 執行
- 每個 task 都要：
  - 範圍小
  - 可單步完成
  - 有明確 acceptance criteria
  - 有測試命令
  - 有 forbidden_files
- 先做能讓專案更穩、可測、可交接的工作
- 若現況文件不足，先把文件補到足夠支援後續重構
