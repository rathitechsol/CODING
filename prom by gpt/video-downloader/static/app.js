(() => {
  const $ = (sel) => document.querySelector(sel);
  const urlInput = $("#urlInput");
  const fetchBtn = $("#fetchBtn");
  const platformBadge = $("#platformBadge");
  const errorBox = $("#errorBox");
  const previewCard = $("#previewCard");
  const thumbnailImg = $("#thumbnailImg");
  const videoTitle = $("#videoTitle");
  const videoMeta = $("#videoMeta");
  const legalHint = $("#legalHint");
  const formatRow = $("#formatRow");
  const formatSelect = $("#formatSelect");
  const downloadBtn = $("#downloadBtn");

  const setYear = () => { const y = new Date().getFullYear(); const n = document.getElementById('year'); if (n) n.textContent = y; };
  setYear();

  const showError = (msg) => {
    errorBox.textContent = msg || "";
    errorBox.classList.toggle("hidden", !msg);
  };

  const setLoading = (isLoading) => {
    fetchBtn.disabled = isLoading;
    fetchBtn.textContent = isLoading ? "Fetching..." : "Fetch";
  };

  const humanFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "";
    const thresh = 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = ['KB','MB','GB','TB'];
    let u = -1;
    do { bytes /= thresh; ++u; } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  };

  const validatePlatform = async (url) => {
    try {
      const { data } = await axios.post('/api/validate', { url });
      if (data && data.platform) {
        platformBadge.textContent = `Detected: ${data.platform}`;
        platformBadge.classList.remove('hidden');
      } else {
        platformBadge.classList.add('hidden');
      }
    } catch (e) {
      platformBadge.classList.add('hidden');
    }
  };

  const populateFormats = (formats) => {
    formatSelect.innerHTML = '';
    (formats || []).forEach(f => {
      const labelParts = [];
      if (f.resolution) labelParts.push(f.resolution);
      if (f.fps) labelParts.push(`${f.fps}fps`);
      if (f.ext) labelParts.push(f.ext.toUpperCase());
      if (f.filesize) labelParts.push(humanFileSize(f.filesize));
      const opt = document.createElement('option');
      opt.value = f.format_id;
      opt.textContent = labelParts.join(' • ');
      formatSelect.appendChild(opt);
    });
  };

  const fetchMetadata = async () => {
    const url = (urlInput.value || '').trim();
    showError('');
    previewCard.classList.add('hidden');
    formatRow.classList.add('hidden');
    legalHint.classList.add('hidden');

    if (!url) {
      showError('Please paste a URL.');
      return;
    }

    setLoading(true);
    try {
      await validatePlatform(url);
      const { data } = await axios.post('/api/metadata', { url });
      if (data.error) throw new Error(data.error);

      thumbnailImg.src = data.thumbnail || '';
      videoTitle.textContent = data.title || 'Untitled';
      const parts = [];
      if (data.platform) parts.push(data.platform);
      if (data.uploader) parts.push(`by ${data.uploader}`);
      if (data.duration) parts.push(`${Math.round(data.duration)}s`);
      videoMeta.textContent = parts.join(' • ');

      previewCard.classList.remove('hidden');

      if (data.permitted && Array.isArray(data.formats) && data.formats.length) {
        populateFormats(data.formats);
        formatRow.classList.remove('hidden');
        legalHint.classList.add('hidden');
      } else {
        legalHint.textContent = 'Downloading is not available for this URL (content may be private, live, DRM-protected, or restricted).';
        legalHint.classList.remove('hidden');
      }
    } catch (e) {
      showError(e?.message || 'Failed to fetch metadata.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = async () => {
    const url = (urlInput.value || '').trim();
    const format_id = (formatSelect.value || '').trim();
    if (!url || !format_id) {
      showError('Missing URL or format.');
      return;
    }
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Preparing...';
    showError('');
    try {
      const response = await axios.post('/api/download', { url, format_id }, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const disposition = response.headers['content-disposition'] || '';
      const match = disposition.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/);
      let filename = 'video.mp4';
      if (match) {
        filename = decodeURIComponent((match[1] || match[2] || filename).replace(/\+/g, '%20'));
      }
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(urlObj), 2000);
    } catch (e) {
      // Try to parse JSON error message
      try {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const j = JSON.parse(reader.result);
            showError(j.error || 'Download failed.');
          } catch (_) { showError('Download failed.'); }
        };
        reader.readAsText(e.response?.data);
      } catch (_) {
        showError('Download failed.');
      }
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download';
    }
  };

  fetchBtn.addEventListener('click', fetchMetadata);
  urlInput.addEventListener('change', () => validatePlatform((urlInput.value || '').trim()));
  urlInput.addEventListener('paste', () => setTimeout(() => validatePlatform((urlInput.value || '').trim()), 10));
  downloadBtn.addEventListener('click', triggerDownload);
})();


