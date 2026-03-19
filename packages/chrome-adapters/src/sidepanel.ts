export async function openSidePanel() {
  if (!chrome?.sidePanel) {
    return;
  }

  await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
}