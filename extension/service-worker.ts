/* Service worker entrypoint for MV3. */
chrome.runtime.onInstalled.addListener(() => {
  console.log("Toby-like extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ ok: true, ts: Date.now() });
  }
});