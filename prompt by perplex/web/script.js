const $ = (q) => document.querySelector(q);

const urlInput = $('#url');
const fetchBtn = $('#fetch');
const preview = $('#preview');
const thumb = $('#thumb');
const titleEl = $('#title');
const durationEl = $('#duration');
const formatSel = $('#format');
const audioOnlyCb = $('#audioOnly');
const downloadBtn = $('#download');
const errorBox = $('#error');

function secondsToHms(d) {
  d = Number(d || 0);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor(d % 60);
  return [h, m, s]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

function setLoading(isLoading) {
  fetchBtn.disabled = isLoading;
  downloadBtn.disabled = isLoading;
}

function setError(msg) {
  if (!msg) {
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
  } else {
    errorBox.classList.remove('hidden');
    errorBox.textContent = msg;
  }
}

async function getInfo() {
  setError('');
  const url = (urlInput.value || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    setError('Please enter a valid public http/https URL.');
    return;
  }
  setLoading(true);
  try {
    const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Failed to fetch info (${res.status})`);
    }
    const data = await res.json();
    preview.classList.remove('hidden');
    titleEl.textContent = data.title || 'Untitled';
    durationEl.textContent = data.duration ? `Duration: ${secondsToHms(data.duration)}` : '';
    thumb.src = data.thumbnail || '';

    // Populate formats
    formatSel.innerHTML = '';
    (data.formats || []).forEach((f) => {
      const h = f.height ? `${f.height}p` : (f.acodec && !f.vcodec ? 'Audio' : 'Unknown');
      const note = f.format_note ? ` • ${f.format_note}` : '';
      const size = f.filesize ? ` • ${(f.filesize / (1024*1024)).toFixed(1)} MB` : '';
      const label = `${(f.ext || '').toUpperCase()} ${h}${note}${size}`;
      const opt = document.createElement('option');
      opt.value = f.format_id || '';
      opt.textContent = label;
      formatSel.appendChild(opt);
    });
  } catch (e) {
    setError(e.message || 'Failed to fetch info.');
  } finally {
    setLoading(false);
  }
}

async function doDownload() {
  setError('');
  const url = (urlInput.value || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    setError('Please enter a valid public http/https URL.');
    return;
  }
  const audioOnly = !!audioOnlyCb.checked;
  const formatId = formatSel.value || '';
  const qs = new URLSearchParams({ url });
  if (audioOnly) qs.set('audio_only', 'true');
  if (formatId) qs.set('format_id', formatId);

  setLoading(true);
  try {
    const res = await fetch(`/api/download?${qs.toString()}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Download failed (${res.status})`);
    }
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    const match = cd.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : 'download';
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    setError(e.message || 'Download failed.');
  } finally {
    setLoading(false);
  }
}

fetchBtn.addEventListener('click', getInfo);
downloadBtn.addEventListener('click', doDownload);


