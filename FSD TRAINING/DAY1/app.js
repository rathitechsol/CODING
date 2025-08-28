/* =========================================================
   Daily Expense Tracker - Vanilla JS
   Files: app.js only (HTML + CSS separately)
   ========================================================= */

(() => {
  'use strict';

  // -------------------------------
  // Constants and Storage
  // -------------------------------
  const STORAGE_KEY = 'det-v1';
  const STORAGE_VERSION = 1;

  // Default categories
  const DEFAULT_CATEGORIES = [
    'Food', 'Groceries', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Travel', 'Other'
  ];

  // Currency options
  const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'AUD', 'CAD', 'JPY'];

  // Methods
  const METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'];

  // -------------------------------
  // Utilities
  // -------------------------------

  // DOM helpers
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const ce = (tag, props = {}) => Object.assign(document.createElement(tag), props);

  // Escape text (use textContent when injecting)
  const text = (s) => (s == null ? '' : String(s));

  // Debounce
  const debounce = (fn, ms = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // Dates
  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const toISO = (date) => {
    // date: Date
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const fromISO = (iso) => {
    // Treat as local date (no time)
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isToday = (iso) => iso === todayISO();

  const weekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = (day + 6) % 7; // make Monday start
    d.setDate(d.getDate() - diff);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const isThisWeek = (iso) => {
    const d = fromISO(iso);
    const ws = weekStart(new Date());
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    return d >= ws && d <= we;
  };

  const isThisMonth = (iso) => {
    const now = new Date();
    const d = fromISO(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const inRange = (iso, startISO, endISO) => {
    if (!startISO && !endISO) return true;
    const d = fromISO(iso);
    if (startISO && d < fromISO(startISO)) return false;
    if (endISO && d > fromISO(endISO)) return false;
    return true;
  };

  // Money: minor units
  const currencyMinorDigits = (currency) => {
    // Common currencies minor digits; default 2
    const map = { JPY: 0, HUF: 0, KRW: 0, TND: 3, BHD: 3, KWD: 3 };
    return map[currency] ?? 2;
  };

  const parseAmountToMinor = (str, currency) => {
    if (typeof str === 'number') str = String(str);
    const digits = currencyMinorDigits(currency);
    const cleaned = String(str).replace(/[,\s]/g, '');
    if (!cleaned || isNaN(Number(cleaned))) return null;
    const f = Math.round(Number(cleaned) * Math.pow(10, digits));
    return f;
  };

  const formatMinor = (minor, currency) => {
    const digits = currencyMinorDigits(currency);
    const value = minor / Math.pow(10, digits);
    const nf = new Intl.NumberFormat(undefined, { style: 'currency', currency }); // Intl.NumberFormat
    return nf.format(value);
  };

  // CSV
  const toCSV = (rows) => {
    const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'id','title','amountMinor','category','method','dateISO','notes','createdAt'
    ];
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push([
        r.id, r.title, r.amountMinor, r.category, r.method, r.dateISO, r.notes ?? '', r.createdAt
      ].map(esc).join(','));
    }
    return lines.join('\n');
  };

  const fromCSV = (csv) => {
    // Not used for import, but kept for completeness
    const [header, ...lines] = csv.split(/\r?\n/);
    const cols = header.split(',').map(h => h.replace(/^"|"$/g, ''));
    return lines.filter(Boolean).map(line => {
      const cells = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i+1] === '"') { cur += '"'; i++; }
          else { inQ = !inQ; }
        } else if (ch === ',' && !inQ) {
          cells.push(cur); cur = '';
        } else cur += ch;
      }
      cells.push(cur);
      const obj = {};
      cols.forEach((k, i) => obj[k] = cells[i]?.replace(/^"|"$/g, ''));
      return obj;
    });
  };

  // Storage with versioning
  const storage = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (typeof data !== 'object' || data === null) return null;
        if (data._v !== STORAGE_VERSION) {
          return this.migrate(data);
        }
        return data;
      } catch {
        return null;
      }
    },
    save(state) {
      const copy = JSON.parse(JSON.stringify(state));
      copy._v = STORAGE_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    },
    migrate(old) {
      // Simple pass-through migration; extend as schema changes
      old._v = STORAGE_VERSION;
      return old;
    },
    clear() {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // -------------------------------
  // State
  // -------------------------------
  const initialState = () => ({
    expenses: [],
    preferences: {
      theme: 'system', // 'light' | 'dark' | 'system'
      currency: 'INR',
      sort: { key: 'date', dir: 'desc' }, // 'amount'|'date'
      filters: {
        query: '',
        range: 'all', // 'all'|'today'|'week'|'month'|'custom'
        start: null,
        end: null,
        categories: [],
        methods: []
      }
    },
    budgets: {
      monthly: null, // minor units
      perCategory: {} // { [category]: minor }
    }
  });

  let state = storage.load() ?? initialState();

  const setState = (updater, persist = true) => {
    const next = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...next };
    if (persist) storage.save(state);
    render();
  };

  // -------------------------------
  // Elements
  // -------------------------------
  const el = {
    themeToggle: qs('#themeToggle'),
    currencySelect: qs('#currencySelect'),
    importBtn: qs('#importBtn'),
    fileImport: qs('#fileImport'),
    exportJsonBtn: qs('#exportJsonBtn'),
    exportCsvBtn: qs('#exportCsvBtn'),
    toasts: qs('#toasts'),
    // Form
    formPanel: qs('#formPanel'),
    toggleForm: qs('#toggleForm'),
    form: qs('#expenseForm'),
    expenseId: qs('#expenseId'),
    title: qs('#title'),
    titleError: qs('#titleError'),
    amount: qs('#amount'),
    amountError: qs('#amountError'),
    date: qs('#date'),
    dateError: qs('#dateError'),
    category: qs('#category'),
    method: qs('#method'),
    notes: qs('#notes'),
    submitBtn: qs('#submitBtn'),
    cancelEditBtn: qs('#cancelEditBtn'),
    // Filters
    searchInput: qs('#searchInput'),
    rangeQuick: qs('#rangeQuick'),
    customRange: qs('#customRange'),
    startDate: qs('#startDate'),
    endDate: qs('#endDate'),
    categoryFilter: qs('#categoryFilter'),
    methodFilter: qs('#methodFilter'),
    clearFiltersBtn: qs('#clearFiltersBtn'),
    activeChips: qs('#activeChips'),
    // List
    countInfo: qs('#countInfo'),
    table: qs('#expenseTable'),
    tbody: qs('#expenseTbody'),
    cards: qs('#cardList'),
    emptyState: qs('#emptyState'),
    addFirstBtn: qs('#addFirstBtn'),
    // Sort headers
    thAmount: qs('th[data-sort-key="amount"]'),
    thDate: qs('th[data-sort-key="date"]'),
    // Summary
    totalToday: qs('#totalToday'),
    totalWeek: qs('#totalWeek'),
    totalMonth: qs('#totalMonth'),
    totalAll: qs('#totalAll'),
    // Footer
    clearAllBtn: qs('#clearAllBtn'),
    loadSampleBtn: qs('#loadSampleBtn'),
    // Import preview
    importPreview: qs('#importPreview'),
    importInfo: qs('#importInfo'),
    importSample: qs('#importSample'),
    mergeImportBtn: qs('#mergeImportBtn'),
    replaceImportBtn: qs('#replaceImportBtn'),
    cancelImportBtn: qs('#cancelImportBtn'),
    // Budget
    toggleBudget: qs('#toggleBudget'),
    budgetBody: qs('#budgetBody'),
    monthlyBudget: qs('#monthlyBudget'),
    perCategoryBudgets: qs('#perCategoryBudgets'),
    budgetProgress: qs('#budgetProgress'),
    // Dev
    seed100Btn: qs('#seed100Btn'),
    seed1kBtn: qs('#seed1kBtn'),
  };

  // -------------------------------
  // Theme
  // -------------------------------
  const applyTheme = () => {
    const t = state.preferences.theme;
    document.documentElement.setAttribute('data-theme', t === 'system' ? 'system' : t);
    // set aria-pressed
    const dark = (t === 'dark') || (t === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    el.themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
  };

  // -------------------------------
  // Toasts (aria-live)
  // -------------------------------
  const toast = (message, type = 'success', timeout = 2500) => {
    const t = ce('div', { className: `toast ${type}`, role: 'status' });
    t.textContent = message;
    el.toasts.appendChild(t);
    setTimeout(() => {
      t.remove();
    }, timeout);
  };

  // -------------------------------
  // Form Validation
  // -------------------------------
  const validateForm = () => {
    let valid = true;

    const title = el.title.value.trim();
    if (!title) {
      el.titleError.textContent = 'Title is required.';
      valid = false;
    } else {
      el.titleError.textContent = '';
    }

    const amtStr = el.amount.value.trim();
    const minor = parseAmountToMinor(amtStr, state.preferences.currency);
    if (amtStr === '' || minor === null || minor <= 0) {
      el.amountError.textContent = 'Enter a positive amount.';
      valid = false;
    } else {
      el.amountError.textContent = '';
    }

    const dateVal = el.date.value || todayISO();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      el.dateError.textContent = 'Invalid date.';
      valid = false;
    } else {
      el.dateError.textContent = '';
    }

    el.submitBtn.disabled = !valid;
    return valid;
  };

  const resetForm = () => {
    el.expenseId.value = '';
    el.title.value = '';
    el.amount.value = '';
    el.category.value = state.defaultCategory ?? DEFAULT_CATEGORIES;
    el.method.value = METHODS;
    el.notes.value = '';
    el.date.value = todayISO();
    el.submitBtn.textContent = 'Add';
    el.cancelEditBtn.classList.add('hidden');
    qs('#formHeading').textContent = 'Add expense';
    validateForm();
  };

  const fillFormForEdit = (exp) => {
    el.expenseId.value = exp.id;
    el.title.value = exp.title;
    const digits = currencyMinorDigits(state.preferences.currency);
    el.amount.value = (exp.amountMinor / Math.pow(10, digits)).toFixed(Math.min(2, digits));
    el.category.value = exp.category;
    el.method.value = exp.method;
    el.notes.value = exp.notes ?? '';
    el.date.value = exp.dateISO;
    el.submitBtn.textContent = 'Update';
    el.cancelEditBtn.classList.remove('hidden');
    qs('#formHeading').textContent = 'Edit expense';
    validateForm();
    // Expand the form if collapsed
    ensureFormExpanded();
  };

  const ensureFormExpanded = () => {
    const collapsed = el.expenseFormHidden;
    if (el.toggleForm.getAttribute('aria-expanded') === 'false') {
      toggleFormPanel();
    }
  };

  // -------------------------------
  // Filters
  // -------------------------------
  const applyFilters = (list) => {
    const f = state.preferences.filters;
    const query = f.query.toLowerCase();
    const cats = new Set(f.categories);
    const meths = new Set(f.methods);

    let start = null, end = null;
    if (f.range === 'today') {
      start = end = todayISO();
    } else if (f.range === 'week') {
      start = toISO(weekStart(new Date()));
      const e = weekStart(new Date());
      e.setDate(e.getDate() + 6);
      end = toISO(e);
    } else if (f.range === 'month') {
      const now = new Date();
      start = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
      end = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (f.range === 'custom') {
      start = f.start || null;
      end = f.end || null;
    }

    return list.filter((e) => {
      if (query) {
        const hay = `${e.title} ${e.notes ?? ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (cats.size && !cats.has(e.category)) return false;
      if (meths.size && !meths.has(e.method)) return false;
      if (!inRange(e.dateISO, start, end)) return false;
      return true;
    });
  };

  const sortList = (list) => {
    const { key, dir } = state.preferences.sort;
    const mul = dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (key === 'amount') return (a.amountMinor - b.amountMinor) * mul;
      if (key === 'date') return (a.dateISO.localeCompare(b.dateISO)) * mul;
      return 0;
    });
  };

  // -------------------------------
  // Rendering
  // -------------------------------
  const renderHeader = () => {
    // Currency options
    el.currencySelect.innerHTML = '';
    for (const c of CURRENCIES) {
      const opt = ce('option', { value: c, textContent: c });
      if (c === state.preferences.currency) opt.selected = true;
      el.currencySelect.appendChild(opt);
    }
    applyTheme();
  };

  const renderCategories = () => {
    // Ensure unknown categories from import exist
    const categories = Array.from(new Set([
      ...DEFAULT_CATEGORIES,
      ...state.expenses.map(e => e.category)
    ])).sort((a, b) => a.localeCompare(b));

    // Form select
    el.category.innerHTML = '';
    for (const c of categories) {
      el.category.appendChild(ce('option', { textContent: c, value: c }));
    }

    // Filters multi-select
    el.categoryFilter.innerHTML = '';
    for (const c of categories) {
      const opt = ce('option', { textContent: c, value: c });
      if (state.preferences.filters.categories.includes(c)) opt.selected = true;
      el.categoryFilter.appendChild(opt);
    }

    // Budget per-category inputs
    el.perCategoryBudgets.innerHTML = '';
    for (const c of categories) {
      const wrap = ce('div', { className: 'field' });
      const id = `budget_${c.replace(/\s+/g, '_')}`;
      const lab = ce('label', { htmlFor: id, textContent: `Budget for ${c}` });
      const inp = ce('input', { id, type: 'number', step: '0.01', min: '0', inputMode: 'decimal' });
      const minor = state.budgets.perCategory[c] ?? null;
      if (minor != null) {
        const digits = currencyMinorDigits(state.preferences.currency);
        inp.value = (minor / Math.pow(10, digits)).toFixed(Math.min(2, digits));
      }
      wrap.append(lab, inp);
      el.perCategoryBudgets.appendChild(wrap);
    }
  };

  const renderFilters = () => {
    // Active chips
    const f = state.preferences.filters;
    el.activeChips.innerHTML = '';
    const chips = [];

    if (f.query) {
      chips.push({ type: 'query', label: `Search: "${f.query}"` });
    }
    if (f.range !== 'all') {
      if (f.range === 'custom') {
        const s = f.start ?? '—';
        const e = f.end ?? '—';
        chips.push({ type: 'range', label: `Range: ${s}–${e}` });
      } else {
        chips.push({ type: 'range', label: `Range: ${f.range}` });
      }
    }
    if (f.categories.length) {
      chips.push({ type: 'categories', label: `Categories: ${f.categories.join(', ')}` });
    }
    if (f.methods.length) {
      chips.push({ type: 'methods', label: `Methods: ${f.methods.join(', ')}` });
    }

  for (const ch of chips) {
    const div = ce('div', { className: 'chip' });
    div.append(ch.label);
    const btn = ce('button', { className: 'x', title: 'Remove', 'aria-label': `Remove ${ch.type}` });
    btn.textContent = '✕';
    btn.addEventListener('click', () => {
      const f2 = JSON.parse(JSON.stringify(state.preferences.filters));
      if (ch.type === 'query') f2.query = '';
      if (ch.type === 'range') { f2.range = 'all'; f2.start = null; f2.end = null; }
      if (ch.type === 'categories') f2.categories = [];
      if (ch.type === 'methods') f2.methods = [];
      setState(s => ({
        ...s,
        preferences: {
          ...s.preferences,
          filters: f2
        }
      }));
    });
    div.appendChild(btn);
    el.activeChips.appendChild(div);
  }
};
