// Background Service Worker (MV3)
// Handles context menus, commands, and routing messages between components

importScripts();

const CONTEXT_MENU_ID = "solve-with-ai";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Solve with AI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;
  const selectedText = info.selectionText || "";
  await routeSolveRequest(tab.id, { source: "context_menu", text: selectedText });
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;
  if (command === "solve_selection") {
    // Ask content script for current selection
    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, async (response) => {
      const text = response?.text || "";
      await routeSolveRequest(tab.id, { source: "shortcut", text });
    });
  } else if (command === "open_chat") {
    chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIDEBAR" });
  } else if (command === "capture_screenshot") {
    chrome.tabs.sendMessage(tab.id, { type: "ACTIVATE_CAPTURE" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SOLVE_CONTENT") {
    // Forward to content script to display sidebar and results
    if (sender?.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "START_SOLVE",
        payload: message.payload
      });
    }
    sendResponse({ ok: true });
    return true;
  }
});

async function routeSolveRequest(tabId, payload) {
  chrome.tabs.sendMessage(tabId, { type: "START_SOLVE", payload });
}


