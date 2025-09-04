// Content Script: selection capture, sidebar host, capture overlay trigger

(() => {
  let lastSelectionText = "";

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    if (text) lastSelectionText = text;
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "GET_SELECTION") {
      sendResponse({ text: lastSelectionText });
      return true;
    }
    if (message?.type === "OPEN_SIDEBAR") {
      openSidebar();
      return true;
    }
    if (message?.type === "ACTIVATE_CAPTURE") {
      activateCaptureOverlay();
      return true;
    }
    if (message?.type === "START_SOLVE") {
      openSidebar();
      const text = message?.payload?.text || lastSelectionText || "";
      postToSidebar({ kind: "solve", text });
      return true;
    }
  });

  function openSidebar() {
    // Use an iframe-based sidebar injected into the page
    const existing = document.getElementById("aiqs-sidebar");
    if (existing) {
      existing.style.display = "block";
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.id = "aiqs-sidebar";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.right = "0";
    iframe.style.width = "380px";
    iframe.style.height = "100vh";
    iframe.style.border = "0";
    iframe.style.zIndex = "2147483647";
    iframe.src = chrome.runtime.getURL("sidebar/sidebar.html");
    document.documentElement.appendChild(iframe);
  }

  function postToSidebar(message) {
    const iframe = document.getElementById("aiqs-sidebar");
    if (!iframe) return;
    iframe.contentWindow?.postMessage({ source: "aiqs", ...message }, "*");
  }

  function activateCaptureOverlay() {
    if (document.getElementById("aiqs-capture-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "aiqs-capture-overlay";
    overlay.className = "aiqs-capture-overlay";
    document.documentElement.appendChild(overlay);

    const canvas = document.createElement("canvas");
    canvas.id = "aiqs-capture-canvas";
    overlay.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let startX = 0, startY = 0, currentX = 0, currentY = 0, dragging = false;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    }
    window.addEventListener("resize", resize);
    resize();

    overlay.addEventListener("mousedown", (e) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      currentX = e.clientX; currentY = e.clientY;
      draw();
    });
    overlay.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      currentX = e.clientX; currentY = e.clientY;
      draw();
    });
    overlay.addEventListener("mouseup", async (e) => {
      dragging = false;
      currentX = e.clientX; currentY = e.clientY;
      draw(true);
      const rect = normalizeRect(startX, startY, currentX, currentY);
      cleanup();
      const dataUrl = await captureArea(rect);
      // Send to sidebar for OCR and solve
      openSidebar();
      postToSidebar({ kind: "screenshot", dataUrl });
    });

    function draw(finish = false) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const rect = normalizeRect(startX, startY, currentX, currentY);
      if (dragging || finish) {
        ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = "#4F46E5";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
      }
    }

    function cleanup() {
      window.removeEventListener("resize", resize);
      overlay.remove();
    }

    function normalizeRect(x1, y1, x2, y2) {
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      return { x, y, w, h };
    }

    async function captureArea(rect) {
      // Use html2canvas as a fallback-free client capture approach
      // Note: For improved fidelity, we could use tab capture via background + offscreen doc.
      const mod = await import(chrome.runtime.getURL("content/html2canvas.min.js"));
      // html2canvas is UMD; accessing from window
      const canvasFull = await window.html2canvas(document.body, { logging: false });
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = rect.w; tempCanvas.height = rect.h;
      const tctx = tempCanvas.getContext("2d");
      tctx.drawImage(canvasFull, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
      return tempCanvas.toDataURL("image/png");
    }
  }
})();


