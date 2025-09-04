export function sendMessage(type, payload){
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (resp) => resolve(resp));
  });
}

if (typeof window !== 'undefined') {
  window.messaging = { sendMessage };
}


