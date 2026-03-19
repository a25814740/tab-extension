export type ExtensionMessage =
  | { type: "PING" }
  | { type: "SAVE_ACTIVE_TAB" }
  | { type: "SAVE_CURRENT_WINDOW" };