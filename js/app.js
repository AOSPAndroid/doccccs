import {
  COUNTRIES,
  COUNTRY_MAP,
  COUNTRY_PACKS,
  CATEGORIES,
  SCOPES,
  FREQUENCIES,
  TEMPLATES,
  TEMPLATE_LIST,
  buildDossier,
  buildSampleDossier,
  defaultTemplateData,
  getPack,
  roleLabel,
  templateLabel,
  uid,
} from "./data.js";
import {
  esc,
  renderDocument,
  renderIndexDocument,
  money,
  fmtDate,
  fmtMonth,
  periodDisplay,
  personFor,
  docDateForPeriod,
} from "./documents.js";
import {
  saveOriginalFile,
  getOriginalFile,
  deleteOriginalFile,
  clearOriginalFiles,
  downloadDocumentPdf,
  exportDossierZip,
  htmlToPdfBlob,
  downloadBlob,
  safeName,
} from "./export.js";

const STORAGE_KEY = "doccccs.dossier.v1";
const UI_KEY = "doccccs.ui.v1";
const landing = document.getElementById("landing");
const appShell = document.getElementById("appShell");
const appNav = document.getElementById("appNav");
const appHeader = document.getElementById("appHeader");
const appMain = document.getElementById("appMain");
const dossierSwitcher = document.getElementById("dossierSwitcher");
const modalRoot = document.getElementById("modalRoot");
const toastRoot = document.getElementById("toastRoot");
const filePicker = document.getElementById("filePicker");

const d = (name) => document.querySelector(`[data-icon="${name}"]`);
const byId = (id) => document.getElementById(id);

const ICONS = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  checklist: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  documents: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>',
  export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M9 13h6"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  alert: '<path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  id: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2.2"/><path d="M4.5 17c.5-2 1.7-3 3.5-3s3 1 3.5 3M14 10h5M14 14h4"/>',
  passport: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="9" r="3"/><path d="M9 9h6M12 6c-1 1-1 5 0 6M8 15h8M8 18h8"/>',
  contract: '<path d="M5 3h11l3 3v15H5Z"/><path d="M16 3v4h4M8 11h8M8 15h8M8 19h4"/>',
  letter: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  payslip: '<path d="M6 3h12v18H6Z"/><path d="M9 7h6M9 11h6M9 15h3"/>',
  receipt: '<path d="M5 3h14v18l-2-2-2 2-2-2-2 2-2-2-2 2-2-2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 9-12h-7Z"/>',
  bank: '<path d="m3 9 9-6 9 6M4 21h16M6 9v9M10 9v9M14 9v9M18 9v9"/>',
  loan: '<path d="M4 19V5h16v14M8 15l3-3 3 2 4-5"/><path d="M4 19h16"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
  calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 19h1M12 19h4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  rings: '<circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/><path d="M9 8 12 3l3 5"/>',
  key: '<circle cx="8" cy="15" r="5"/><path d="m12 12 8-8M16 4l3 3M14 6l3 3"/>',
  hammer: '<path d="m14 5 5 5M12 7l5-5 4 4-5 5M3 21l8-8M4 20l4-4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  quote: '<path d="M7 7h4v5H7c0 3 2 4 4 4M15 7h4v5h-4c0 3 2 4 4 4"/>',
  pen: '<path d="m3 21 3.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L3 21ZM14 7l3 3"/>',
  folder: '<path d="M3 6h7l2 2h9v11H3Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  external: '<path d="M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.file}</svg>`;
}

function applyIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((element) => {
    if (!element.dataset.iconApplied) {
      element.innerHTML = icon(element.dataset.icon);
      element.dataset.iconApplied = "true";
    }
  });
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const personName = (person, fallback = "Unnamed applicant") => person?.fullName?.trim() || fallback;

function initials(person) {
  return String(person?.fullName || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function personRole(person) {
  return person ? roleLabel(person.role, dossier.type) : "Household";
}

let dossier = null;
let ui = {
  tab: "overview",
  categoryFilter: "All",
  docFilter: "all",
  docSearch: "",
  exportOptions: { includeGenerated: true, includeOriginals: true, includeIndex: true, includeManifest: true },
};
let saveTimer;
let filePickerContext = null;
let modalOnClose = null;
let lastFocused = null;
let heroSample = null;

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || !parsed?.requirements || !parsed?.persons) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadUi() {
  try {
    const stored = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    ui = { ...ui, ...stored, exportOptions: { ...ui.exportOptions, ...(stored.exportOptions || {}) } };
  } catch {
    // Keep defaults.
  }
}

function saveUi() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ categoryFilter: ui.categoryFilter, docFilter: ui.docFilter, exportOptions: ui.exportOptions }));
  } catch {
    // UI preferences are non-critical.
  }
}

function saveDossier(immediate = false) {
  if (!dossier) return;
  dossier.updatedAt = nowIso();
  const run = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dossier));
    } catch {
      showToast("The dossier is too large for browser storage. Remove a large generated photo or export now.", "error");
    }
  };
  clearTimeout(saveTimer);
  if (immediate) run();
  else saveTimer = setTimeout(run, 180);
}

function showToast(message, type = "success") {
  const element = document.createElement("div");
  element.className = `toast ${type === "error" ? "toast--error" : ""}`;
  element.innerHTML = `${icon(type === "error" ? "alert" : "check")}<span>${esc(message)}</span>`;
  toastRoot.appendChild(element);
  setTimeout(() => {
    element.style.opacity = "0";
    element.style.transform = "translateY(6px)";
    element.style.transition = "opacity 160ms ease, transform 160ms ease";
    setTimeout(() => element.remove(), 180);
  }, 3900);
}

function showProgress(title = "Packing your dossier", message = "Preparing documents…") {
  byId("progressOverlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "progress-overlay";
  overlay.id = "progressOverlay";
  overlay.innerHTML = `<div class="progress-panel"><h3>${esc(title)}</h3><p id="progressMessage">${esc(message)}</p><div class="progress-bar"><span id="progressFill"></span></div><div class="progress-label" id="progressLabel">0%</div></div>`;
  document.body.appendChild(overlay);
}

function updateProgress(percent, label) {
  const fill = byId("progressFill");
  const text = byId("progressLabel");
  const message = byId("progressMessage");
  if (fill) fill.style.width = `${clamp(percent, 0, 100)}%`;
  if (text) text.textContent = `${clamp(Math.round(percent), 0, 100)}%`;
  if (message && label) message.textContent = label;
}

function hideProgress() {
  byId("progressOverlay")?.remove();
}

function openModal(html, className = "", onClose = null) {
  lastFocused = document.activeElement;
  modalOnClose = onClose;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal ${className}" role="dialog" aria-modal="true">${html}</section></div>`;
  document.body.classList.add("modal-open");
  applyIcons(modalRoot);
  const first = modalRoot.querySelector("input:not([type=hidden]), select, textarea, button");
  setTimeout(() => first?.focus(), 30);
}

function closeModal() {
  if (!modalRoot.firstElementChild) return;
  if (modalOnClose) {
    try { modalOnClose(); } catch { /* no-op */ }
  }
  modalOnClose = null;
  modalRoot.innerHTML = "";
  document.body.classList.remove("modal-open");
  lastFocused?.focus?.();
}

function modalHeader(kicker, title, subtitle = "") {
  return `<div class="modal__header"><div class="modal__title"><p>${esc(kicker)}</p><h2>${esc(title)}</h2>${subtitle ? `<span>${esc(subtitle)}</span>` : ""}</div><button class="modal__close" type="button" data-action="close-modal" aria-label="Close">${icon("x")}</button></div>`;
}

function setupModal() {
  openModal(`
    ${modalHeader("New dossier", "What are we putting together?", "Choose a starting point. Every later field stays editable.")}
    <form id="setupForm">
      <div class="modal__body">
        <div class="type-picker">
          <label class="type-option"><input type="radio" name="type" value="rental" checked><span class="type-option__card"><span class="type-option__icon">${icon("home")}</span><strong>Rental application</strong><span>Tenants, co-tenants and guarantors</span></span></label>
          <label class="type-option"><input type="radio" name="type" value="mortgage"><span class="type-option__card"><span class="type-option__icon">${icon("key")}</span><strong>Mortgage application</strong><span>Borrowers, co-borrowers and financial evidence</span></span></label>
        </div>
        <div class="setup-grid" style="margin-top:16px">
          <div class="field"><label for="setupCountry">Country</label><select id="setupCountry" name="countryCode">${COUNTRIES.map((country) => `<option value="${country.code}" ${country.code === "fr" ? "selected" : ""}>${country.flag} ${esc(country.name)}</option>`).join("")}<option value="other">Other country…</option></select></div>
          <div class="field"><label for="setupTitle">Dossier name</label><input id="setupTitle" name="title" value="Rental dossier — France" autocomplete="off"></div>
          <div class="field" id="customCountryField" hidden><label for="customCountry">Country name</label><input id="customCountry" name="customCountry" placeholder="e.g. Switzerland"></div>
          <div class="field"><label for="setupCurrency">Currency</label><select id="setupCurrency" name="currency">${["EUR", "GBP", "USD", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "PLN"].map((code) => `<option value="${code}">${code}</option>`).join("")}</select></div>
        </div>
        <div class="setup-note"><strong>A blank, working dossier.</strong> France rental and mortgage lists are loaded from the supplied requirements. The other country kits are practical starting points; add or edit any requirement afterwards. Start from the sample dossier instead if you just want to explore.</div>
      </div>
      <div class="modal__footer"><button class="btn btn--ghost form-actions__left" type="button" data-action="open-sample">Load sample instead</button><button class="btn btn--ghost" type="button" data-action="close-modal">Cancel</button><button class="btn btn--ink" type="submit">Create dossier ${icon("arrow")}</button></div>
    </form>`, "", null);
  const countrySelect = byId("setupCountry");
  const typeInputs = modalRoot.querySelectorAll('input[name="type"]');
  const titleInput = byId("setupTitle");
  let titleTouched = false;
  const sync = () => {
    const type = modalRoot.querySelector('input[name="type"]:checked')?.value || "rental";
    const country = countrySelect.value === "other" ? "your country" : COUNTRY_MAP[countrySelect.value]?.name || "France";
    if (!titleTouched) titleInput.value = `${type === "mortgage" ? "Mortgage" : "Rental"} dossier — ${country}`;
    byId("customCountryField").hidden = countrySelect.value !== "other";
    const selected = COUNTRY_MAP[countrySelect.value];
    byId("setupCurrency").value = selected?.currency || "EUR";
  };
  countrySelect.addEventListener("change", sync);
  typeInputs.forEach((input) => input.addEventListener("change", sync));
  titleInput.addEventListener("input", () => { titleTouched = true; });
  sync();
}

function createFromSetup(form) {
  const formData = new FormData(form);
  const countryCode = formData.get("countryCode");
  const type = formData.get("type");
  const countryName = countryCode === "other" ? String(formData.get("customCountry") || "").trim() : COUNTRY_MAP[countryCode]?.name;
  if (countryCode === "other" && !countryName) {
    showToast("Add the country name to continue.", "error");
    return;
  }
  const created = buildDossier({
    title: String(formData.get("title") || "").trim(),
    type,
    countryCode: countryCode === "other" ? "other" : countryCode,
    countryName: countryName || "Other country",
  });
  created.currency = formData.get("currency") || created.currency;
  created.persons[0].role = "applicant";
  dossier = created;
  ui.tab = "overview";
  saveDossier(true);
  closeModal();
  enterApp();
  if (!dossier.persons[0].fullName) openPersonModal(dossier.persons[0].id);
}

function loadSample() {
  dossier = buildSampleDossier();
  ui.tab = "overview";
  saveDossier(true);
  closeModal();
  enterApp();
  showToast("Sample dossier loaded. Everything is editable.");
}

function enterApp() {
  landing.hidden = true;
  appShell.hidden = false;
  document.body.classList.add("app-open");
  window.history.replaceState(null, "", "#studio");
  renderApp();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function goHome() {
  appShell.hidden = true;
  landing.hidden = false;
  document.body.classList.remove("app-open");
  window.history.replaceState(null, "", "#");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderApp() {
  if (!dossier) return;
  renderSidebar();
  renderHeader();
  renderMain();
}

function mainTabs() {
  const stats = coverageStats();
  return [
    { id: "overview", label: "Overview", icon: "overview" },
    { id: "checklist", label: "Checklist", icon: "checklist", badge: dossier.requirements.length },
    { id: "people", label: "People", icon: "users", badge: dossier.persons.length },
    { id: "documents", label: "Documents", icon: "documents", badge: stats.missingRequired ? stats.missingRequired : dossier.documents.length + dossier.uploads.length, alert: stats.missingRequired > 0 },
    { id: "export", label: "Export", icon: "export" },
  ];
}

function renderSidebar() {
  const pack = getPack(dossier.countryCode);
  dossierSwitcher.innerHTML = `<button class="dossier-pill" data-action="edit-dossier"><span class="dossier-pill__icon">${dossier.type === "mortgage" ? "M" : "R"}</span><span class="dossier-pill__text"><strong>${esc(dossier.title)}</strong><span>${esc(dossier.country)} · ${dossier.type === "mortgage" ? "Mortgage" : "Rental"}</span></span><span style="color:rgba(255,255,255,.38)">${icon("chevron")}</span></button>`;
  const tabs = mainTabs();
  appNav.innerHTML = `<div class="app-nav__label">Dossier</div>${tabs.map((tab, index) => `${index === 4 ? '<div class="app-nav__label" style="margin-top:12px">Finish</div>' : ""}<button class="nav-item ${ui.tab === tab.id ? "active" : ""}" data-action="nav" data-tab="${tab.id}">${icon(tab.icon)}<span>${tab.label}</span>${tab.badge !== undefined ? `<span class="nav-item__badge ${tab.alert ? "nav-item__badge--alert" : ""}">${tab.badge}</span>` : ""}</button>`).join("")}`;
}

function renderHeader() {
  const stats = coverageStats();
  appHeader.innerHTML = `
    <button class="icon-btn mobile-menu" data-action="toggle-sidebar" aria-label="Open menu">${icon("menu")}</button>
    <div class="header-crumb"><p class="header-crumb__eyebrow">Dossier studio</p><h1>${esc(dossier.title)}</h1></div>
    <div class="header-meta"><span class="header-pill header-pill--country">${esc(dossier.country)}</span><span class="header-pill header-pill--people">${dossier.persons.length} ${dossier.persons.length === 1 ? "person" : "people"}</span><div class="header-progress" title="${stats.percent}% of required slots covered"><span style="width:${stats.percent}%"></span></div><span class="header-pill header-pill--status">${stats.percent}% ready</span><button class="btn btn--ink btn--small" data-action="go-export">${icon("export")} Export ZIP</button></div>`;
  applyIcons(appHeader);
}

function personsForRequirement(requirement) {
  if (requirement.scope === "household") return [null];
  if (requirement.scope === "guarantor") return dossier.persons.filter((person) => person.role === "guarantor");
  return dossier.persons.filter((person) => person.role !== "guarantor");
}

function docsForSlot(requirementId, personId) {
  return dossier.documents.filter((doc) => doc.requirementId === requirementId && (doc.personId || null) === (personId || null));
}

function uploadsForSlot(requirementId, personId) {
  return dossier.uploads.filter((upload) => upload.requirementId === requirementId && (upload.personId || null) === (personId || null));
}

function slotComplete(requirementId, personId) {
  return docsForSlot(requirementId, personId).length > 0 || uploadsForSlot(requirementId, personId).length > 0;
}

function requirementStatus(requirement) {
  const persons = personsForRequirement(requirement);
  if (!persons.length) return "na";
  const complete = persons.filter((person) => slotComplete(requirement.id, person?.id || null)).length;
  if (complete === persons.length) return "complete";
  return complete ? "partial" : "missing";
}

function requiredSlots() {
  const slots = [];
  dossier.requirements.filter((requirement) => requirement.required).forEach((requirement) => {
    personsForRequirement(requirement).forEach((person) => {
      slots.push({ requirement, person, personId: person?.id || null });
    });
  });
  return slots;
}

function coverageStats() {
  const slots = requiredSlots();
  const completed = slots.filter((slot) => slotComplete(slot.requirement.id, slot.personId)).length;
  const allSlots = [];
  dossier.requirements.forEach((requirement) => {
    personsForRequirement(requirement).forEach((person) => allSlots.push({ requirement, person, personId: person?.id || null }));
  });
  const allCompleted = allSlots.filter((slot) => slotComplete(slot.requirement.id, slot.personId)).length;
  return {
    percent: slots.length ? Math.round((completed / slots.length) * 100) : 0,
    completed,
    total: slots.length,
    missingRequired: slots.length - completed,
    allPercent: allSlots.length ? Math.round((allCompleted / allSlots.length) * 100) : 0,
    allCompleted,
    allTotal: allSlots.length,
  };
}

function getMissingSlots(requiredOnly = true) {
  const slots = [];
  dossier.requirements.forEach((requirement) => {
    if (requiredOnly && !requirement.required) return;
    personsForRequirement(requirement).forEach((person) => {
      if (!slotComplete(requirement.id, person?.id || null)) slots.push({ requirement, person, personId: person?.id || null });
    });
  });
  return slots;
}

function personProgress(person) {
  const requirements = dossier.requirements.filter((requirement) => requirement.required && personsForRequirement(requirement).some((candidate) => candidate?.id === person?.id || (!candidate && !person)));
  const complete = requirements.filter((requirement) => slotComplete(requirement.id, person?.id || null)).length;
  return { percent: requirements.length ? Math.round((complete / requirements.length) * 100) : 0, complete, total: requirements.length };
}

function pageHead(eyebrow, title, description, actions = "") {
  return `<div class="page-head"><div><p class="page-head__eyebrow">${esc(eyebrow)}</p><h2>${esc(title)}</h2>${description ? `<p class="page-head__desc">${esc(description)}</p>` : ""}</div>${actions ? `<div class="page-head__actions">${actions}</div>` : ""}</div>`;
}

function renderMain() {
  if (ui.tab === "checklist") appMain.innerHTML = renderChecklist();
  else if (ui.tab === "people") appMain.innerHTML = renderPeople();
  else if (ui.tab === "documents") appMain.innerHTML = renderDocuments();
  else if (ui.tab === "export") appMain.innerHTML = renderExport();
  else appMain.innerHTML = renderOverview();
  applyIcons(appMain);
}

function getRequirement(id) {
  return dossier.requirements.find((requirement) => requirement.id === id);
}

function getDocument(id) {
  return dossier.documents.find((doc) => doc.id === id);
}

function renderOverview() {
  const stats = coverageStats();
  const missing = getMissingSlots(true).slice(0, 4);
  const recentDocs = [...dossier.documents].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3);
  return `
    ${pageHead("Overview", "Your dossier, at a glance.", "One source of truth for people, requirements, drafts and originals.", `<button class="btn btn--ghost btn--small" data-action="nav" data-tab="documents">${icon("documents")} Add document</button><button class="btn btn--ink btn--small" data-action="go-export">${icon("export")} Export</button>`)}
    <div class="overview-grid">
      <div class="overview-stack">
        <div class="progress-card">
          <div class="progress-donut" style="--value:${stats.percent}"><div class="progress-donut__value">${stats.percent}<small>%</small></div></div>
          <div class="progress-copy"><h3>${stats.missingRequired ? `${stats.missingRequired} required ${stats.missingRequired === 1 ? "item" : "items"} left.` : "Required checklist covered."}</h3><p>${stats.missingRequired ? "Complete the remaining slots, or upload an issuer original where it matters more than a draft." : "Everything required is documented. Review the pack, add optional evidence, then export the ZIP."}</p><div class="progress-legend"><span><i></i>${stats.completed} covered</span><span><i></i>${stats.missingRequired} missing</span><span><i></i>${stats.total} required slots</span></div></div>
        </div>
        <div class="stats-strip">
          <div class="stat-card"><span>Generated drafts</span><strong>${dossier.documents.length}</strong><small>Editable A4 documents</small></div>
          <div class="stat-card"><span>Originals</span><strong>${dossier.uploads.length}</strong><small>Stored in this browser</small></div>
          <div class="stat-card"><span>People</span><strong>${dossier.persons.length}</strong><small>Applicants + guarantors</small></div>
          <div class="stat-card"><span>Checklist</span><strong>${dossier.requirements.length}</strong><small>${dossier.requirements.filter((r) => r.required).length} required</small></div>
        </div>
        <section class="card">
          <div class="card__head"><div><h3>What’s still missing</h3><p>Required items without a draft or original</p></div><button class="card__link" data-action="nav" data-tab="documents">Open documents</button></div>
          <div class="card__body">${missing.length ? `<div class="missing-list">${missing.map((slot) => `<div class="missing-row"><span class="missing-row__dot"></span><div class="missing-row__text"><strong>${esc(slot.requirement.label)}</strong><span>${esc(slot.person ? personName(slot.person) : "Household / shared")} · ${esc(SCOPES[slot.requirement.scope]?.short || "Document")}</span></div><button type="button" data-action="slot-open" data-req="${slot.requirement.id}" data-person="${slot.personId || ""}" title="Add this document">${icon("plus")}</button></div>`).join("")}</div>` : `<div class="empty-inline">No required items missing. Nice.</div>`}</div>
        </section>
        <section class="card">
          <div class="card__head"><div><h3>Recently generated</h3><p>Open any page to edit it or download a PDF</p></div><button class="card__link" data-action="nav" data-tab="documents">All documents</button></div>
          <div class="card__body">${recentDocs.length ? `<div class="recent-docs">${recentDocs.map((doc) => `<button class="recent-doc" type="button" data-action="preview-doc" data-id="${doc.id}"><span class="recent-doc__preview">${renderDocument(doc, dossier)}</span><span>${esc(doc.title || TEMPLATES[doc.templateId]?.label || "Document")}</span><small>${esc(personFor(doc, dossier) ? personName(personFor(doc, dossier)) : "Household")}</small></button>`).join("")}</div>` : `<div class="empty-inline">No drafts yet. Generate your first from the Documents tab.</div>`}</div>
        </section>
      </div>
      <div class="overview-stack">
        <section class="card">
          <div class="card__head"><div><h3>People in this dossier</h3><p>Each person keeps their own document coverage</p></div><button class="card__link" data-action="add-person">Add person</button></div>
          <div class="card__body"><div class="people-mini">${dossier.persons.map((person) => { const progress = personProgress(person); return `<div class="person-mini"><div class="avatar">${esc(initials(person))}</div><div class="person-mini__main"><strong>${esc(personName(person))}</strong><span>${esc(personRole(person))}</span></div><span class="person-mini__score">${progress.percent}%</span></div>`; }).join("")}</div></div>
        </section>
        <section class="card">
          <div class="card__head"><div><h3>Dossier context</h3><p>Prefills property and party fields</p></div><button class="card__link" data-action="edit-dossier">Edit all</button></div>
          <div class="card__body"><form id="detailsForm"><div class="details-grid">
            <div class="field field--full"><label for="detailProperty">Target property</label><input id="detailProperty" name="propertyAddress" value="${esc(dossier.context?.propertyAddress || "")}" placeholder="Address, city, postcode"></div>
            ${dossier.type === "mortgage" ? `<div class="field"><label for="detailPrice">Purchase price</label><input id="detailPrice" name="purchasePrice" type="number" step="0.01" value="${esc(dossier.context?.purchasePrice || "")}"></div>` : `<div class="field"><label for="detailRent">Monthly rent</label><input id="detailRent" name="monthlyRent" type="number" step="0.01" value="${esc(dossier.context?.monthlyRent || "")}"></div>`}
            <div class="field"><label for="detailDate">Application date</label><input id="detailDate" name="applicationDate" type="date" value="${esc(dossier.context?.applicationDate || today())}"></div>
            <div class="field"><label for="detailLandlord">Landlord / agent</label><input id="detailLandlord" name="landlordName" value="${esc(dossier.context?.landlordName || "")}"></div>
            <div class="field"><label for="detailLender">Lender / notary</label><input id="detailLender" name="lenderName" value="${esc(dossier.context?.lenderName || "")}" placeholder="Lender or notary"></div>
          </div><div class="details-foot"><span class="save-note">Saved in this browser</span><button class="btn btn--ghost btn--small" type="submit">${icon("check")} Save context</button></div></form></div>
        </section>
        <section class="card">
          <div class="card__head"><div><h3>Country kit</h3><p>${esc(dossier.country)} · ${esc(dossier.currency)}</p></div><button class="card__link" data-action="edit-dossier">Settings</button></div>
          <div class="card__body"><p class="doc-small doc-muted" style="margin:0 0 13px">${esc(getPack(dossier.countryCode).note || "Edit the checklist to match local practice.")}</p><div class="doc-file-list"><span class="mini-tag">${dossier.requirements.length} requirements</span><span class="mini-tag">${dossier.requirements.filter((r) => r.required).length} required</span><span class="mini-tag">${dossier.requirements.filter((r) => r.frequency === "monthly").length} monthly sets</span><span class="mini-tag">${dossier.requirements.filter((r) => r.frequency === "annual").length} annual sets</span></div></div>
        </section>
      </div>
    </div>`;
}

function renderChecklist() {
  const categories = ["All", ...CATEGORIES.filter((category) => dossier.requirements.some((requirement) => requirement.category === category))];
  const filtered = dossier.requirements.filter((requirement) => ui.categoryFilter === "All" || requirement.category === ui.categoryFilter);
  const grouped = filtered.reduce((groups, requirement) => {
    (groups[requirement.category] ||= []).push(requirement);
    return groups;
  }, {});
  return `
    ${pageHead("Editable checklist", "The rules of this dossier.", "Built from a country kit, then fully editable: scope, frequency, required flag and the documents that satisfy each item.", `<button class="btn btn--ghost btn--small" data-action="restore-kit">${icon("layers")} Restore country kit</button><button class="btn btn--ink btn--small" data-action="add-requirement">${icon("plus")} Add requirement</button>`)}
    <div class="checklist-toolbar"><div class="category-nav">${categories.map((category) => `<button class="filter-chip ${ui.categoryFilter === category ? "active" : ""}" data-action="category-filter" data-category="${esc(category)}">${esc(category)}</button>`).join("")}</div><div class="checklist-toolbar__spacer"></div><span class="mini-tag">${dossier.requirements.filter((r) => r.required).length} required</span><span class="mini-tag">${dossier.requirements.filter((r) => !r.required).length} optional</span></div>
    ${Object.entries(grouped).map(([category, requirements]) => `<div class="req-group"><div class="req-group__head">${esc(category)} <span>${requirements.length}</span></div><div class="card">${requirements.map((requirement) => {
      const templates = requirement.templates.map((templateId) => templateLabel(templateId, dossier.countryCode)).slice(0, 3);
      return `<div class="req-row"><label class="req-check" title="Required"><input type="checkbox" data-action="toggle-required" data-id="${requirement.id}" ${requirement.required ? "checked" : ""}><span>${icon("check")}</span></label><div class="req-main"><strong>${esc(requirement.label)}</strong><p>${esc(requirement.description || "Editable dossier requirement.")}</p></div><div class="req-meta">${templates.map((label) => `<span class="mini-tag mini-tag--template">${esc(label)}</span>`).join("")}${requirement.templates.length > 3 ? `<span class="mini-tag">+${requirement.templates.length - 3}</span>` : ""}<span class="mini-tag">${esc(SCOPES[requirement.scope]?.short || requirement.scope)}</span><span class="mini-tag">${esc(FREQUENCIES[requirement.frequency]?.short || "Single")}${requirement.defaultCount > 1 ? ` · ${requirement.defaultCount}` : ""}</span>${!requirement.required ? '<span class="mini-tag mini-tag--optional">Optional</span>' : ""}</div><div class="req-actions"><button class="icon-btn" data-action="edit-requirement" data-id="${requirement.id}" title="Edit requirement">${icon("edit")}</button><button class="icon-btn" data-action="delete-requirement" data-id="${requirement.id}" title="Delete requirement">${icon("trash")}</button></div></div>`;
    }).join("")}</div></div>`).join("") || `<div class="card"><div class="empty-state"><div class="empty-state__icon">${icon("checklist")}</div><h3>No requirements in this category.</h3><p>Add one or switch back to All.</p></div></div>`}`;
}

function renderPeople() {
  return `
    ${pageHead("People", "Everyone gets their own pile.", "Applicants, co-applicants and guarantors are tracked separately. Requirements apply to the scope set in the checklist.", `<button class="btn btn--ink btn--small" data-action="add-person">${icon("plus")} Add person</button>`)}
    <div class="people-grid">
      ${dossier.persons.map((person) => {
        const progress = personProgress(person);
        return `<section class="card person-card"><div class="person-card__top"><div class="person-card__identity"><div class="avatar">${esc(initials(person))}</div><div><strong>${esc(personName(person))}</strong><span>${esc(personRole(person))}</span></div></div><div class="req-actions"><button class="icon-btn" data-action="edit-person" data-id="${person.id}" title="Edit person">${icon("edit")}</button><button class="icon-btn" data-action="delete-person" data-id="${person.id}" title="Remove person">${icon("trash")}</button></div></div><div class="person-card__money"><strong>${person.netMonthly ? esc(money(dossier, person.netMonthly)) : "—"}</strong><span>net / month</span></div><div class="person-card__details">${person.selfEmployed ? '<span class="mini-tag">Self-employed</span>' : person.employerName ? '<span class="mini-tag">Employed</span>' : ""}${person.role === "guarantor" ? '<span class="mini-tag">Guarantor</span>' : ""}${person.nationality ? `<span class="mini-tag">${esc(person.nationality)}</span>` : ""}<span class="mini-tag">${progress.complete}/${progress.total} required</span></div><div class="person-card__foot"><span>${esc(person.address || "Address not added")}</span><span class="progress-mini"><i style="width:${progress.percent}%"></i></span></div></section>`;
      }).join("")}
      <button class="add-person-card" data-action="add-person"><i>+</i><span>Add a co-applicant or guarantor</span><span style="font-weight:400;font-size:9px;color:var(--muted-2)">Identity and income stay separate</span></button>
    </div>`;
}

function renderDocuments() {
  const stats = coverageStats();
  const search = ui.docSearch.trim().toLowerCase();
  const counts = {
    all: dossier.documents.length + dossier.uploads.length,
    generated: dossier.documents.length,
    originals: dossier.uploads.length,
    missing: getMissingSlots(false).length,
  };
  const filterLabel = { all: "All documents", generated: "Generated drafts", originals: "Originals", missing: "Missing" };
  const cards = dossier.requirements.map((requirement) => {
    const persons = personsForRequirement(requirement);
    const allDocs = dossier.documents.filter((doc) => doc.requirementId === requirement.id);
    const allUploads = dossier.uploads.filter((upload) => upload.requirementId === requirement.id);
    const docMatches = [...allDocs, ...allUploads].some((file) => `${file.title || file.name || ""} ${requirement.label}`.toLowerCase().includes(search));
    if (search && !docMatches && !persons.some((person) => personName(person).toLowerCase().includes(search))) return "";
    if (ui.docFilter === "generated" && !allDocs.length) return "";
    if (ui.docFilter === "originals" && !allUploads.length) return "";
    if (ui.docFilter === "missing" && persons.every((person) => slotComplete(requirement.id, person?.id || null))) return "";
    const visiblePersons = persons.filter((person) => {
      const docs = docsForSlot(requirement.id, person?.id || null);
      const uploads = uploadsForSlot(requirement.id, person?.id || null);
      if (ui.docFilter === "generated" && !docs.length) return false;
      if (ui.docFilter === "originals" && !uploads.length) return false;
      if (ui.docFilter === "missing" && (docs.length || uploads.length)) return false;
      if (search && !(`${personName(person)} ${requirement.label} ${docs.map((item) => item.title).join(" ")} ${uploads.map((item) => item.name).join(" ")}`.toLowerCase().includes(search))) return false;
      return true;
    });
    if (!visiblePersons.length && ui.docFilter !== "missing") return "";
    const status = requirementStatus(requirement);
    return `<section class="card doc-slot">
      <div class="doc-slot__head"><span class="doc-slot__status ${status}"></span><div class="doc-slot__title"><strong>${esc(requirement.label)}</strong><span>${esc(requirement.category)} · ${esc(SCOPES[requirement.scope]?.short || "Document")}${requirement.frequency !== "none" ? ` · ${esc(FREQUENCIES[requirement.frequency]?.short)} set` : ""}${!requirement.required ? " · optional" : ""}</span></div><div class="req-meta">${requirement.templates.slice(0, 2).map((templateId) => `<span class="mini-tag mini-tag--template">${esc(templateLabel(templateId, dossier.countryCode))}</span>`).join("")}${requirement.templates.length > 2 ? `<span class="mini-tag">+${requirement.templates.length - 2}</span>` : ""}</div><button class="icon-btn" data-action="edit-requirement" data-id="${requirement.id}" title="Edit requirement">${icon("edit")}</button></div>
      <div class="doc-slot__body">
        ${visiblePersons.length ? visiblePersons.map((person) => {
          const personId = person?.id || null;
          const docs = docsForSlot(requirement.id, personId);
          const uploads = uploadsForSlot(requirement.id, personId);
          const matchingDocs = docs.filter((doc) => !search || `${doc.title} ${requirement.label}`.toLowerCase().includes(search));
          const matchingUploads = uploads.filter((upload) => !search || `${upload.name} ${requirement.label}`.toLowerCase().includes(search));
          const showMissing = !docs.length && !uploads.length;
          return `<div class="doc-person-row"><div class="doc-person-row__name"><strong>${esc(person ? personName(person) : "Household / shared")}</strong><span>${esc(person ? personRole(person) : "Shared evidence")}</span></div><div class="doc-file-list">
            ${matchingDocs.map((doc) => `<button type="button" class="doc-file" data-action="preview-doc" data-id="${doc.id}"><span class="doc-file__type">DRAFT</span><span class="doc-file__name">${esc(doc.title || TEMPLATES[doc.templateId]?.short || "Document")}</span></button>`).join("")}
            ${matchingUploads.map((upload) => `<button type="button" class="doc-file" data-action="preview-upload" data-id="${upload.id}"><span class="doc-file__type original">ORIGINAL</span><span class="doc-file__name">${esc(upload.name)}</span></button>`).join("")}
            ${showMissing && (ui.docFilter === "all" || ui.docFilter === "missing" || !search) ? `<button type="button" class="doc-file doc-file--missing" data-action="upload-slot" data-req="${requirement.id}" data-person="${personId || ""}">${icon("plus")} Add evidence</button>` : ""}
          </div><div class="doc-row-actions"><button class="btn btn--ghost" type="button" data-action="upload-slot" data-req="${requirement.id}" data-person="${personId || ""}" title="Upload original">${icon("upload")} Original</button>${requirement.templates.length ? `<button class="btn btn--ink" type="button" data-action="generate-slot" data-req="${requirement.id}" data-person="${personId || ""}">${icon("plus")} ${docs.length ? "More" : "Draft"}</button>` : ""}</div></div>`;
        }).join("") : `<div class="not-applicable">${icon("info")} ${requirement.scope === "guarantor" ? "No guarantor in this dossier yet." : "No applicable documents."} ${requirement.scope === "guarantor" ? `<button class="card__link" data-action="add-person" data-role="guarantor">Add guarantor</button>` : ""}</div>`}
      </div>
    </section>`;
  }).filter(Boolean).join("");
  return `
    ${pageHead("Documents", "Draft it or upload it.", "Every slot can hold generated drafts and issuer-provided originals at the same time. Originals are preserved as uploaded.", `<button class="btn btn--ghost btn--small" data-action="add-requirement">${icon("plus")} New requirement</button><button class="btn btn--ink btn--small" data-action="go-export">${icon("export")} Export ZIP</button>`)}
    <div class="stats-strip"><div class="stat-card"><span>Required slots</span><strong>${stats.completed}/${stats.total}</strong><small>${stats.percent}% covered</small></div><div class="stat-card"><span>Generated drafts</span><strong>${dossier.documents.length}</strong><small>Editable PDFs on export</small></div><div class="stat-card"><span>Uploaded originals</span><strong>${dossier.uploads.length}</strong><small>Preserved unchanged</small></div><div class="stat-card"><span>Missing required</span><strong>${stats.missingRequired}</strong><small>${stats.missingRequired ? "Needs your attention" : "Checklist covered"}</small></div></div>
    <div class="doc-filters"><div class="search-box">${icon("search")}<input type="search" id="docSearch" data-search="documents" value="${esc(ui.docSearch)}" placeholder="Search documents or people…"></div><div class="category-nav">${Object.entries(filterLabel).map(([key, label]) => `<button class="filter-chip ${ui.docFilter === key ? "active" : ""}" data-action="doc-filter" data-filter="${key}">${label} <span style="opacity:.55">${counts[key]}</span></button>`).join("")}</div></div>
    ${cards || `<div class="card"><div class="empty-state"><div class="empty-state__icon">${icon("documents")}</div><h3>No documents in this view.</h3><p>Change the filter or add a requirement to start building the dossier.</p><button class="btn btn--ink btn--small" data-action="add-requirement">Add requirement</button></div></div>`}`;
}

function renderExportTree() {
  const items = [];
  items.push(`<div><strong>${esc(safeName(dossier.title))}/</strong></div>`);
  if (ui.exportOptions.includeIndex) items.push(`<div><i>├─</i>00_Dossier_Index.pdf <span>cover index</span></div>`);
  dossier.requirements.forEach((requirement, index) => {
    const docs = dossier.documents.filter((doc) => doc.requirementId === requirement.id);
    const uploads = dossier.uploads.filter((upload) => upload.requirementId === requirement.id);
    if (!docs.length && !uploads.length) return;
    const count = (ui.exportOptions.includeGenerated ? docs.length : 0) + (ui.exportOptions.includeOriginals ? uploads.length : 0);
    if (!count) return;
    items.push(`<div><i>├─</i>${String(index + 1).padStart(2, "0")}_${esc(safeName(requirement.category))}/ <span>${esc(requirement.label)}</span></div>`);
  });
  if (ui.exportOptions.includeManifest) items.push(`<div><i>├─</i>manifest.csv <span>source + path table</span></div>`);
  items.push(`<div><i>└─</i>README.txt <span>source labels</span></div>`);
  return items.join("");
}

function renderExport() {
  const stats = coverageStats();
  const filesCount = (ui.exportOptions.includeGenerated ? dossier.documents.length : 0) + (ui.exportOptions.includeOriginals ? dossier.uploads.length : 0) + (ui.exportOptions.includeIndex ? 1 : 0);
  return `
    ${pageHead("Export", "Make the hand-off tidy.", "Downloads a ZIP with PDF drafts, untouched originals, a cover index and a manifest. No server, no account.", `<button class="btn btn--ghost btn--small" data-action="preview-index">${icon("eye")} Preview index</button><button class="btn btn--ink btn--small" data-action="export-zip">${icon("export")} Download ZIP</button>`)}
    <div class="export-layout">
      <div class="overview-stack">
        <div class="export-hero"><div class="doc-kicker" style="color:var(--lime)">Ready to pack</div><h3>${stats.missingRequired ? `${stats.missingRequired} required ${stats.missingRequired === 1 ? "slot is" : "slots are"} still open.` : "The required checklist is covered."}</h3><p>${stats.missingRequired ? "You can still export an incomplete dossier — useful when you want to show someone what is outstanding. Or finish the checklist first." : "Review the individual drafts, attach any issuer originals, then export. The ZIP index makes the structure easy to follow."}</p><button class="btn btn--cream" data-action="export-zip">${icon("download")} Download complete dossier</button><div class="export-stats"><div><strong>${dossier.documents.length}</strong><span>PDF drafts</span></div><div><strong>${dossier.uploads.length}</strong><span>Originals</span></div><div><strong>${filesCount}</strong><span>Files + index</span></div></div></div>
        <section class="card"><div class="card__head"><div><h3>ZIP structure</h3><p>Names are sorted by requirement and person</p></div></div><div class="card__body"><div class="zip-tree">${renderExportTree()}</div></div></section>
        <div class="${stats.missingRequired ? "warning-box" : "warning-box success-box"}">${icon(stats.missingRequired ? "alert" : "check")}<div>${stats.missingRequired ? `<strong>${stats.missingRequired} required slot(s) missing.</strong> The ZIP will still include every document you have now.` : `<strong>Checklist covered.</strong> Every required slot has a draft or original.`}</div></div>
      </div>
      <div class="overview-stack">
        <section class="card"><div class="card__head"><div><h3>What goes in</h3><p>Choose what to include in this export</p></div></div><div class="card__body">
          <label class="option-row"><input type="checkbox" data-export-option="includeGenerated" ${ui.exportOptions.includeGenerated ? "checked" : ""}><span><strong>Generated drafts (${dossier.documents.length})</strong><span>Rendered as A4 PDFs</span></span></label>
          <label class="option-row"><input type="checkbox" data-export-option="includeOriginals" ${ui.exportOptions.includeOriginals ? "checked" : ""}><span><strong>Uploaded originals (${dossier.uploads.length})</strong><span>Copied byte-for-byte with original filenames</span></span></label>
          <label class="option-row"><input type="checkbox" data-export-option="includeIndex" ${ui.exportOptions.includeIndex ? "checked" : ""}><span><strong>Dossier index</strong><span>Cover page with people and coverage status</span></span></label>
          <label class="option-row"><input type="checkbox" data-export-option="includeManifest" ${ui.exportOptions.includeManifest ? "checked" : ""}><span><strong>Manifest CSV</strong><span>Person, requirement, source and path</span></span></label>
        </div></section>
        <section class="card"><div class="card__head"><div><h3>Source labels</h3><p>Kept explicit in filenames and manifest</p></div></div><div class="card__body"><div class="doc-file-list"><span class="doc-file"><span class="doc-file__type">DRAFT</span> Generated in Doccccs</span><span class="doc-file"><span class="doc-file__type original">ORIGINAL</span> Uploaded by you</span></div><p class="doc-small doc-muted" style="margin:13px 0 0;line-height:1.55">Generated pages are facsimiles, not issuer-issued documents. The ZIP includes a README that says exactly that.</p></div></section>
        <section class="card"><div class="card__head"><div><h3>Dossier details</h3><p>${esc(dossier.country)} · ${esc(dossier.currency)}</p></div><button class="card__link" data-action="edit-dossier">Edit</button></div><div class="card__body"><div class="doc-meta-grid"><div class="doc-meta"><span>Type</span><strong>${dossier.type === "mortgage" ? "Mortgage application" : "Rental application"}</strong></div><div class="doc-meta"><span>Applicants</span><strong>${dossier.persons.filter((p) => p.role !== "guarantor").length}</strong></div><div class="doc-meta"><span>Guarantors</span><strong>${dossier.persons.filter((p) => p.role === "guarantor").length}</strong></div><div class="doc-meta"><span>Last saved</span><strong>${esc(fmtDate(dossier.updatedAt?.slice(0, 10) || today(), dossier))}</strong></div></div></div></section>
      </div>
    </div>`;
}

function fieldHtml(field, value) {
  const full = field.wide || field.type === "textarea" ? " field--full" : "";
  const common = `id="field-${field.key}" data-field="${field.key}"`;
  let control = "";
  if (field.type === "textarea") {
    control = `<textarea ${common} rows="${field.rows || 4}" placeholder="${esc(field.placeholder || "")}">${esc(value ?? "")}</textarea>`;
  } else if (field.type === "select") {
    control = `<select ${common}>${(field.options || []).map((option) => `<option ${String(value) === String(option) ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>`;
  } else if (field.type === "file") {
    control = `<input ${common} type="file" accept="image/png,image/jpeg,image/webp"><div class="field__hint">${esc(field.hint || "JPG or PNG.")}</div>`;
  } else {
    control = `<input ${common} type="${field.type || "text"}" ${field.step ? `step="${field.step}"` : ""} value="${esc(value ?? "")}" placeholder="${esc(field.placeholder || "")}">`;
  }
  return `<div class="field${full}"><label for="field-${field.key}">${esc(field.label)}</label>${control}${field.hint && field.type !== "file" ? `<div class="field__hint">${esc(field.hint)}</div>` : ""}</div>`;
}

function groupedFieldsHtml(fields, data) {
  const groups = new Map();
  fields.forEach((field) => {
    const group = field.group || "Details";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(field);
  });
  return [...groups.entries()].map(([group, groupFields], index) => `<div class="form-section"><div class="form-section__title"><span>${index + 1}</span>${esc(group)}</div><div class="form-grid">${groupFields.map((field) => fieldHtml(field, data[field.key])).join("")}</div></div>`).join("");
}

function openPersonModal(personId = null, presetRole = "coapplicant") {
  const existing = personId ? dossier.persons.find((person) => person.id === personId) : null;
  const person = existing || {
    id: uid("person"),
    role: presetRole,
    fullName: "",
    birthDate: "",
    birthPlace: "",
    nationality: "",
    sex: "",
    address: "",
    email: "",
    phone: "",
    idNumber: "",
    idExpiry: "",
    passportNumber: "",
    passportExpiry: "",
    employerName: "",
    employerAddress: "",
    jobTitle: "",
    contractType: "Permanent",
    startDate: "",
    grossMonthly: "",
    netMonthly: "",
    selfEmployed: false,
    businessName: "",
    registrationNumber: "",
    bankName: "",
    iban: "",
    savingsBalance: "",
  };
  const roleOptions = ["applicant", "coapplicant", "guarantor"].map((role) => `<option value="${role}" ${person.role === role ? "selected" : ""}>${esc(roleLabel(role, dossier.type))}</option>`).join("");
  openModal(`
    ${modalHeader(existing ? "Edit person" : "Add person", existing ? personName(person) : "Who is in this dossier?", "Details here prefill generated documents and keep each person’s evidence separate.")}
    <form id="personForm" data-person-id="${existing ? person.id : ""}">
      <div class="modal__body">
        <div class="form-section"><div class="form-section__title"><span>1</span>Role and identity</div><div class="form-grid">
          <div class="field"><label for="personRole">Role in dossier</label><select id="personRole" name="role">${roleOptions}</select></div>
          <div class="field"><label for="personName">Full name</label><input id="personName" name="fullName" value="${esc(person.fullName)}" autocomplete="name"></div>
          <div class="field"><label for="personBirthDate">Date of birth</label><input id="personBirthDate" name="birthDate" type="date" value="${esc(person.birthDate)}"></div>
          <div class="field"><label for="personBirthPlace">Place of birth</label><input id="personBirthPlace" name="birthPlace" value="${esc(person.birthPlace)}"></div>
          <div class="field"><label for="personNationality">Nationality</label><input id="personNationality" name="nationality" value="${esc(person.nationality)}"></div>
          <div class="field"><label for="personSex">Sex on ID</label><select id="personSex" name="sex"><option value="">Not specified</option><option ${person.sex === "F" ? "selected" : ""}>F</option><option ${person.sex === "M" ? "selected" : ""}>M</option><option ${person.sex === "X" ? "selected" : ""}>X</option></select></div>
        </div></div>
        <div class="form-section"><div class="form-section__title"><span>2</span>Address and identity documents</div><div class="form-grid">
          <div class="field field--full"><label for="personAddress">Home address</label><input id="personAddress" name="address" value="${esc(person.address)}" autocomplete="street-address"></div>
          <div class="field"><label for="personEmail">Email</label><input id="personEmail" name="email" type="email" value="${esc(person.email)}" autocomplete="email"></div>
          <div class="field"><label for="personPhone">Phone</label><input id="personPhone" name="phone" value="${esc(person.phone)}" autocomplete="tel"></div>
          <div class="field"><label for="personIdNumber">ID number</label><input id="personIdNumber" name="idNumber" value="${esc(person.idNumber)}"></div>
          <div class="field"><label for="personIdExpiry">ID valid until</label><input id="personIdExpiry" name="idExpiry" type="date" value="${esc(person.idExpiry)}"></div>
          <div class="field"><label for="personPassport">Passport number</label><input id="personPassport" name="passportNumber" value="${esc(person.passportNumber)}"></div>
          <div class="field"><label for="personPassportExpiry">Passport valid until</label><input id="personPassportExpiry" name="passportExpiry" type="date" value="${esc(person.passportExpiry)}"></div>
        </div></div>
        <div class="form-section"><div class="form-section__title"><span>3</span>Employment and income</div><div class="form-grid">
          <div class="field"><label for="personEmployer">Employer / business</label><input id="personEmployer" name="employerName" value="${esc(person.employerName)}"></div>
          <div class="field"><label for="personJob">Job title</label><input id="personJob" name="jobTitle" value="${esc(person.jobTitle)}"></div>
          <div class="field field--full"><label for="personEmployerAddress">Employer address</label><input id="personEmployerAddress" name="employerAddress" value="${esc(person.employerAddress)}"></div>
          <div class="field"><label for="personContract">Contract type</label><select id="personContract" name="contractType">${["Permanent", "Fixed term", "Freelance", "Internship", "Retired", "Student"].map((option) => `<option ${person.contractType === option ? "selected" : ""}>${option}</option>`).join("")}</select></div>
          <div class="field"><label for="personStart">Employment start</label><input id="personStart" name="startDate" type="date" value="${esc(person.startDate)}"></div>
          <div class="field"><label for="personGross">Gross monthly income</label><input id="personGross" name="grossMonthly" type="number" step="0.01" value="${esc(person.grossMonthly)}"></div>
          <div class="field"><label for="personNet">Net monthly income</label><input id="personNet" name="netMonthly" type="number" step="0.01" value="${esc(person.netMonthly)}"></div>
          <div class="field field--full"><label class="switch"><input type="checkbox" name="selfEmployed" ${person.selfEmployed ? "checked" : ""}><span class="switch__track"></span>Self-employed / business owner</label></div>
          <div class="field"><label for="personBusiness">Business name</label><input id="personBusiness" name="businessName" value="${esc(person.businessName)}"></div>
          <div class="field"><label for="personRegistration">Registration number</label><input id="personRegistration" name="registrationNumber" value="${esc(person.registrationNumber)}"></div>
        </div></div>
        <div class="form-section"><div class="form-section__title"><span>4</span>Bank details</div><div class="form-grid">
          <div class="field"><label for="personBank">Bank</label><input id="personBank" name="bankName" value="${esc(person.bankName)}"></div>
          <div class="field"><label for="personIban">IBAN</label><input id="personIban" name="iban" value="${esc(person.iban)}"></div>
          <div class="field"><label for="personSavings">Savings available</label><input id="personSavings" name="savingsBalance" type="number" step="0.01" value="${esc(person.savingsBalance)}"></div>
        </div></div>
      </div>
      <div class="modal__footer"><button class="btn btn--ghost form-actions__left" type="button" data-action="close-modal">Cancel</button><button class="btn btn--ink" type="submit">${icon("check")} ${existing ? "Save person" : "Add person"}</button></div>
    </form>`, "modal--medium", null);
}

function handlePersonSubmit(form) {
  const data = new FormData(form);
  const personId = form.dataset.personId;
  const existing = dossier.persons.find((person) => person.id === personId);
  const person = existing || { id: uid("person") };
  ["fullName", "role", "birthDate", "birthPlace", "nationality", "sex", "address", "email", "phone", "idNumber", "idExpiry", "passportNumber", "passportExpiry", "employerName", "employerAddress", "jobTitle", "contractType", "startDate", "grossMonthly", "netMonthly", "businessName", "registrationNumber", "bankName", "iban", "savingsBalance"].forEach((key) => {
    person[key] = String(data.get(key) || "").trim();
  });
  person.selfEmployed = data.get("selfEmployed") === "on";
  if (!person.fullName) person.fullName = "Unnamed applicant";
  if (!existing) dossier.persons.push(person);
  saveDossier();
  closeModal();
  renderApp();
  showToast(existing ? "Person updated." : `${roleLabel(person.role, dossier.type)} added.`);
}

function openRequirementModal(requirementId = null) {
  const existing = requirementId ? getRequirement(requirementId) : null;
  const requirement = existing || {
    id: uid("req"),
    label: "",
    category: "Other",
    templates: [],
    description: "",
    required: true,
    scope: "applicant",
    frequency: "none",
    defaultCount: 1,
    conditional: false,
  };
  const templateChecks = TEMPLATE_LIST.map((template) => `<label class="check-item"><input type="checkbox" name="templates" value="${template.id}" ${requirement.templates.includes(template.id) ? "checked" : ""}><span>${esc(template.label)}<small>${esc(template.description)}</small></span></label>`).join("");
  openModal(`
    ${modalHeader(existing ? "Edit requirement" : "Add requirement", existing ? requirement.label : "What needs to be in the dossier?", "Requirements can be generated from a template, satisfied by an upload, or both.")}
    <form id="requirementForm" data-req-id="${existing ? requirement.id : ""}">
      <div class="modal__body">
        <div class="form-grid">
          <div class="field field--full"><label for="reqLabel">Requirement label</label><input id="reqLabel" name="label" value="${esc(requirement.label)}" placeholder="e.g. Latest income tax assessment"></div>
          <div class="field"><label for="reqCategory">Category</label><select id="reqCategory" name="category">${CATEGORIES.map((category) => `<option ${requirement.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div>
          <div class="field"><label for="reqScope">Applies to</label><select id="reqScope" name="scope">${Object.entries(SCOPES).map(([key, scope]) => `<option value="${key}" ${requirement.scope === key ? "selected" : ""}>${esc(scope.label)}</option>`).join("")}</select></div>
          <div class="field field--full"><label for="reqDescription">Description / instruction</label><textarea id="reqDescription" name="description" rows="3" placeholder="What should be supplied?">${esc(requirement.description)}</textarea></div>
          <div class="field"><label for="reqFrequency">Record type</label><select id="reqFrequency" name="frequency">${Object.entries(FREQUENCIES).map(([key, frequency]) => `<option value="${key}" ${requirement.frequency === key ? "selected" : ""}>${esc(frequency.label)}</option>`).join("")}</select></div>
          <div class="field"><label for="reqCount">Records to generate by default</label><input id="reqCount" name="defaultCount" type="number" min="1" max="36" value="${requirement.defaultCount || 1}"></div>
          <div class="field field--full"><label class="switch"><input type="checkbox" name="required" ${requirement.required ? "checked" : ""}><span class="switch__track"></span>Required for completeness</label></div>
        </div>
        <div class="form-section"><div class="form-section__title"><span>+</span>Generated document options</div><div class="check-grid">${templateChecks}</div><p class="field__hint" style="margin-top:8px">Select any document layouts that can satisfy this requirement. Leave none selected for upload-only documents.</p></div>
      </div>
      <div class="modal__footer"><button class="btn btn--ghost form-actions__left" type="button" data-action="close-modal">Cancel</button><button class="btn btn--ink" type="submit">${icon("check")} ${existing ? "Save requirement" : "Add requirement"}</button></div>
    </form>`, "modal--medium", null);
}

function handleRequirementSubmit(form) {
  const data = new FormData(form);
  const id = form.dataset.reqId;
  const existing = id ? getRequirement(id) : null;
  const templates = data.getAll("templates").map(String);
  const label = String(data.get("label") || "").trim();
  if (!label) {
    showToast("Give the requirement a label.", "error");
    return;
  }
  const requirement = existing || { id: uid("req"), key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
  requirement.label = label;
  requirement.category = String(data.get("category") || "Other");
  requirement.description = String(data.get("description") || "").trim();
  requirement.scope = String(data.get("scope") || "applicant");
  requirement.frequency = String(data.get("frequency") || "none");
  requirement.defaultCount = clamp(Number(data.get("defaultCount")) || 1, 1, 36);
  requirement.required = data.get("required") === "on";
  requirement.templates = templates;
  if (!existing) dossier.requirements.push(requirement);
  saveDossier();
  closeModal();
  renderApp();
  showToast(existing ? "Requirement updated." : "Requirement added.");
}

function openDossierSettings() {
  const options = COUNTRIES.map((country) => `<option value="${country.code}" ${dossier.countryCode === country.code ? "selected" : ""}>${country.flag} ${esc(country.name)}</option>`).join("") + `<option value="other" ${dossier.countryCode === "other" ? "selected" : ""}>Other / custom country</option>`;
  openModal(`
    ${modalHeader("Dossier settings", "The details behind the pack.", "Country and currency affect document formatting. Checklist changes are always manual after creation.")}
    <form id="dossierSettingsForm">
      <div class="modal__body">
        <div class="form-grid">
          <div class="field field--full"><label for="settingsTitle">Dossier name</label><input id="settingsTitle" name="title" value="${esc(dossier.title)}"></div>
          <div class="field"><label for="settingsType">Application type</label><select id="settingsType" name="type"><option value="rental" ${dossier.type === "rental" ? "selected" : ""}>Rental application</option><option value="mortgage" ${dossier.type === "mortgage" ? "selected" : ""}>Mortgage application</option></select></div>
          <div class="field"><label for="settingsCountryCode">Country kit</label><select id="settingsCountryCode" name="countryCode">${options}</select></div>
          <div class="field"><label for="settingsCountryName">Country name</label><input id="settingsCountryName" name="country" value="${esc(dossier.country)}"></div>
          <div class="field"><label for="settingsCurrency">Currency</label><select id="settingsCurrency" name="currency">${["EUR", "GBP", "USD", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "PLN"].map((code) => `<option ${dossier.currency === code ? "selected" : ""}>${code}</option>`).join("")}</select></div>
          <div class="field"><label for="settingsLocale">Formatting locale</label><input id="settingsLocale" name="locale" value="${esc(dossier.locale || "en-GB")}" placeholder="en-GB"></div>
          <div class="field field--full"><label for="settingsProperty">Target property</label><input id="settingsProperty" name="propertyAddress" value="${esc(dossier.context?.propertyAddress || "")}"></div>
          <div class="field"><label for="settingsRent">Monthly rent</label><input id="settingsRent" name="monthlyRent" type="number" step="0.01" value="${esc(dossier.context?.monthlyRent || "")}"></div>
          <div class="field"><label for="settingsPrice">Purchase price</label><input id="settingsPrice" name="purchasePrice" type="number" step="0.01" value="${esc(dossier.context?.purchasePrice || "")}"></div>
          <div class="field"><label for="settingsLandlord">Landlord / agent</label><input id="settingsLandlord" name="landlordName" value="${esc(dossier.context?.landlordName || "")}"></div>
          <div class="field"><label for="settingsLender">Lender</label><input id="settingsLender" name="lenderName" value="${esc(dossier.context?.lenderName || "")}"></div>
          <div class="field"><label for="settingsNotary">Notary</label><input id="settingsNotary" name="notaryName" value="${esc(dossier.context?.notaryName || "")}"></div>
          <div class="field"><label for="settingsDate">Application date</label><input id="settingsDate" name="applicationDate" type="date" value="${esc(dossier.context?.applicationDate || today())}"></div>
        </div>
        <div class="setup-note">Changing the country kit does not overwrite your checklist. Use “Restore country kit” on the Checklist tab to add missing preset items.</div>
      </div>
      <div class="modal__footer"><button class="btn btn--ghost form-actions__left" type="button" data-action="close-modal">Cancel</button><button class="btn btn--ink" type="submit">${icon("check")} Save settings</button></div>
    </form>`, "modal--medium", null);
  const countrySelect = byId("settingsCountryCode");
  countrySelect.addEventListener("change", () => {
    const country = COUNTRY_MAP[countrySelect.value];
    if (country) {
      byId("settingsCountryName").value = country.name;
      byId("settingsCurrency").value = country.currency;
      byId("settingsLocale").value = country.locale;
    }
  });
}

function handleDossierSettings(form) {
  const data = new FormData(form);
  dossier.title = String(data.get("title") || dossier.title).trim();
  dossier.type = String(data.get("type") || dossier.type);
  dossier.countryCode = String(data.get("countryCode") || dossier.countryCode);
  dossier.country = String(data.get("country") || dossier.country).trim();
  dossier.currency = String(data.get("currency") || dossier.currency);
  dossier.locale = String(data.get("locale") || dossier.locale);
  dossier.context = {
    ...dossier.context,
    propertyAddress: String(data.get("propertyAddress") || ""),
    monthlyRent: String(data.get("monthlyRent") || ""),
    purchasePrice: String(data.get("purchasePrice") || ""),
    landlordName: String(data.get("landlordName") || ""),
    lenderName: String(data.get("lenderName") || ""),
    notaryName: String(data.get("notaryName") || ""),
    applicationDate: String(data.get("applicationDate") || ""),
  };
  saveDossier();
  closeModal();
  renderApp();
  showToast("Dossier settings saved.");
}

function openConfirm(title, message, confirmLabel, onConfirm, danger = true) {
  openModal(`
    ${modalHeader("Confirm", title, "")}
    <div class="modal__body"><p class="confirm-copy">${message}</p></div>
    <div class="modal__footer"><button class="btn btn--ghost" type="button" data-action="close-modal">Cancel</button><button class="btn ${danger ? "btn--danger" : "btn--ink"}" type="button" id="confirmAction">${esc(confirmLabel)}</button></div>`, "", null);
  byId("confirmAction").addEventListener("click", async () => {
    const button = byId("confirmAction");
    button.disabled = true;
    try {
      await onConfirm();
      closeModal();
    } catch {
      button.disabled = false;
      showToast("That action could not be completed.", "error");
    }
  });
}

function fitPreview(container, html) {
  if (!container) return;
  container.innerHTML = `<div class="doc-preview-scaler">${html}</div>`;
  const wrapper = container.firstElementChild;
  const available = Math.max(290, container.clientWidth - 38);
  const scale = Math.min(0.82, available / 794);
  wrapper.style.setProperty("--scale", scale);
  wrapper.style.width = `${794 * scale}px`;
  wrapper.style.height = `${1123 * scale}px`;
}

function addMonths(period, offset) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function defaultEarliest(unit, count) {
  if (unit === "annual") return String(new Date().getFullYear() - count);
  const now = new Date();
  const latest = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return addMonths(latest, -(count - 1));
}

function buildPeriods(unit, start, count) {
  if (unit === "annual") {
    const startYear = clamp(Number(start) || new Date().getFullYear() - 1, 1990, 2100);
    return Array.from({ length: count }, (_, index) => String(startYear + index));
  }
  return Array.from({ length: count }, (_, index) => addMonths(start || defaultEarliest("monthly", count), index));
}

function applyPeriodData(templateId, data, period) {
  const next = clone(data);
  if (!period) return next;
  if (templateId === "payslip") next.payDate = docDateForPeriod("payslip", period);
  if (templateId === "rent_receipt") next.paymentDate = `${period}-05`;
  if (templateId === "tax_notice") {
    next.fiscalYear = period;
    next.issueDate = `${Number(period) + 1}-09-03`;
  }
  if (templateId === "urssaf_declaration") next.declarationDate = `${period}-15`;
  if (templateId === "annual_accounts") next.documentDate = `${period}-12-31`;
  return next;
}

function makeDocTitle(templateId, period, person) {
  const label = templateLabel(templateId, dossier.countryCode);
  const periodPart = period ? periodDisplay(period, dossier) : "";
  return `${label}${periodPart ? ` — ${periodPart}` : ""}${person ? ` — ${personName(person)}` : ""}`;
}

async function portraitDataUrl(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 480 / bitmap.width, 600 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }
}

function openGenerateModal({ reqId, personId = null, editId = null }) {
  const requirement = getRequirement(reqId);
  if (!requirement || !requirement.templates.length) return;
  const existingDoc = editId ? getDocument(editId) : null;
  let person = personId ? dossier.persons.find((item) => item.id === personId) : null;
  if (!person && reqId && !personId) person = null;
  let templateId = existingDoc?.templateId || requirement.templates[0];
  let data = existingDoc ? clone(existingDoc.data) : defaultTemplateData(templateId, person || dossier.persons[0], dossier);
  if (!existingDoc) {
    if (templateId === "proof_of_address" && !data.documentDate) data.documentDate = today();
    if (templateId === "employment_letter" && !data.issueDate) data.issueDate = today();
    if (templateId === "savings_statement" && !data.documentDate) data.documentDate = today();
  }
  let currentUnit = existingDoc ? "none" : TEMPLATES[templateId].series;
  let recordCount = Math.max(1, requirement.defaultCount || 1);
  let startPeriod = currentUnit === "none" ? "" : defaultEarliest(currentUnit, recordCount);
  openModal(`
    ${modalHeader(existingDoc ? "Edit document" : "Generate documents", existingDoc ? existingDoc.title || templateLabel(templateId, dossier.countryCode) : requirement.label, existingDoc ? "Changes apply to this single draft." : `${person ? personName(person) : "Household / shared"} · ${dossier.country} · ${dossier.currency}`)}
    <form id="generateForm">
      <div class="generate-layout">
        <div class="generate-form-pane" id="generateFields"></div>
        <div class="generate-preview-pane"><div class="preview-toolbar"><span class="preview-toolbar__title">Live A4 preview</span><div class="preview-toolbar__right"><button type="button" data-action="preview-reset">Reset zoom</button></div></div><div class="preview-scroll" id="generatePreview"></div></div>
      </div>
      <div class="modal__footer"><button class="btn btn--ghost form-actions__left" type="button" data-action="close-modal">Cancel</button><button class="btn btn--ink" type="submit">${icon("check")} ${existingDoc ? "Save changes" : "Create document"}</button></div>
    </form>`, "modal--wide", null);

  const fieldsPane = byId("generateFields");
  const previewPane = byId("generatePreview");
  let previewScale = 0.6;

  const updatePreview = () => {
    const previewPeriod = currentUnit !== "none" ? startPeriod : existingDoc?.period || "";
    const previewData = currentUnit !== "none" ? applyPeriodData(templateId, data, previewPeriod) : data;
    const previewDoc = { id: editId || `preview-${templateId}`, templateId, requirementId: reqId, personId: person?.id || null, period: previewPeriod, data: previewData, title: makeDocTitle(templateId, previewPeriod, person), createdAt: nowIso() };
    fitPreview(previewPane, renderDocument(previewDoc, dossier));
    const wrapper = previewPane.querySelector(".doc-preview-scaler");
    if (previewScale !== 0.6) {
      const scale = Math.min(0.84, Math.max(0.32, previewScale));
      wrapper.style.setProperty("--scale", scale);
      wrapper.style.width = `${794 * scale}px`;
      wrapper.style.height = `${1123 * scale}px`;
    }
    if (previewPane.dataset.zoom === "custom") {
      const scale = Number(previewPane.dataset.scale || 0.6);
      wrapper.style.setProperty("--scale", scale);
      wrapper.style.width = `${794 * scale}px`;
      wrapper.style.height = `${1123 * scale}px`;
    }
  };

  const renderFields = () => {
    const template = TEMPLATES[templateId];
    const picker = requirement.templates.length > 1 && !existingDoc
      ? `<div class="template-picker">${requirement.templates.map((id) => `<button type="button" class="template-pick ${templateId === id ? "active" : ""}" data-template="${id}">${icon(TEMPLATES[id]?.icon || "file")}${esc(templateLabel(id, dossier.countryCode))}</button>`).join("")}</div>`
      : "";
    const periodBox = currentUnit !== "none" && !existingDoc ? `<div class="period-box"><div class="period-box__title">Record set</div><div class="form-grid"><div class="field"><label for="genCount">Records</label><input id="genCount" type="number" min="1" max="24" value="${recordCount}"></div><div class="field"><label for="genStart">${currentUnit === "annual" ? "Earliest year" : "Earliest month"}</label><input id="genStart" type="${currentUnit === "annual" ? "number" : "month"}" min="${currentUnit === "annual" ? "1990" : ""}" max="${currentUnit === "annual" ? "2100" : ""}" value="${esc(startPeriod)}"></div></div><div class="record-count-note">Creates ${recordCount} separate A4 ${currentUnit === "annual" ? "annual" : "monthly"} record${recordCount === 1 ? "" : "s"}, ending with the most recent selected period.</div></div>` : "";
    fieldsPane.innerHTML = `${picker}${periodBox}${groupedFieldsHtml(template.fields, data)}`;
    fieldsPane.querySelectorAll("[data-template]").forEach((button) => button.addEventListener("click", () => {
      templateId = button.dataset.template;
      currentUnit = TEMPLATES[templateId].series;
      recordCount = Math.max(1, requirement.defaultCount || 1);
      startPeriod = currentUnit === "none" ? "" : defaultEarliest(currentUnit, recordCount);
      data = defaultTemplateData(templateId, person || dossier.persons[0], dossier);
      renderFields();
      updatePreview();
    }));
    fieldsPane.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("input", () => {
        data[input.dataset.field] = input.value;
        updatePreview();
      });
      input.addEventListener("change", () => {
        data[input.dataset.field] = input.value;
        updatePreview();
      });
      if (input.type === "file") {
        input.addEventListener("change", async () => {
          const file = input.files?.[0];
          if (!file) return;
          data[input.dataset.field] = await portraitDataUrl(file);
          updatePreview();
          showToast("Portrait added to this draft preview.");
        });
      }
    });
    const countInput = byId("genCount");
    const startInput = byId("genStart");
    countInput?.addEventListener("input", () => {
      recordCount = clamp(Number(countInput.value) || 1, 1, 24);
      startPeriod = defaultEarliest(currentUnit, recordCount);
      startInput.value = startPeriod;
      const note = fieldsPane.querySelector(".record-count-note");
      if (note) note.textContent = `Creates ${recordCount} separate A4 ${currentUnit === "annual" ? "annual" : "monthly"} record${recordCount === 1 ? "" : "s"}, ending with the most recent selected period.`;
      updatePreview();
    });
    startInput?.addEventListener("input", () => {
      startPeriod = startInput.value;
      updatePreview();
    });
    updatePreview();
  };

  renderFields();
  const form = byId("generateForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (existingDoc) {
      existingDoc.data = clone(data);
      existingDoc.title = makeDocTitle(existingDoc.templateId, existingDoc.period, person);
      existingDoc.editedAt = nowIso();
      saveDossier();
      closeModal();
      renderApp();
      showToast("Document draft updated.");
      return;
    }
    const unit = currentUnit;
    const count = unit === "none" ? 1 : clamp(Number(byId("genCount")?.value) || recordCount, 1, 24);
    const start = unit === "none" ? "" : byId("genStart")?.value || startPeriod;
    const periods = unit === "none" ? [""] : buildPeriods(unit, start, count);
    const createdAt = nowIso();
    periods.forEach((period, index) => {
      const docData = period ? applyPeriodData(templateId, data, period) : clone(data);
      dossier.documents.push({
        id: uid("doc"),
        templateId,
        requirementId: reqId,
        personId: person?.id || null,
        period,
        data: docData,
        title: makeDocTitle(templateId, period, person),
        createdAt,
        order: index,
      });
    });
    saveDossier();
    closeModal();
    renderApp();
    showToast(`${periods.length} ${periods.length === 1 ? "draft" : "drafts"} created.`);
  });
  const previewButton = modalRoot.querySelector('[data-action="preview-reset"]');
  previewButton?.addEventListener("click", () => {
    previewScale = 0.6;
    previewPane.dataset.zoom = "";
    fitPreview(previewPane, previewPane.innerHTML ? previewPane.firstElementChild.innerHTML : "");
    updatePreview();
  });
}

function openDocPreview(docId) {
  const doc = getDocument(docId);
  if (!doc) return;
  const requirement = getRequirement(doc.requirementId);
  const person = personFor(doc, dossier);
  openModal(`
    ${modalHeader("Document preview", doc.title || TEMPLATES[doc.templateId]?.label || "Draft", `${person ? personName(person) : "Household"} · ${requirement?.label || "Document"}${doc.period ? ` · ${periodDisplay(doc.period, dossier)}` : ""}`)}
    <div class="doc-preview-shell" id="docPreviewShell"></div>
    <div class="modal__footer"><button class="btn btn--danger form-actions__left" type="button" data-action="delete-doc" data-id="${doc.id}">${icon("trash")} Delete</button><button class="btn btn--ghost" type="button" data-action="download-doc" data-id="${doc.id}">${icon("download")} Download PDF</button><button class="btn btn--ink" type="button" data-action="edit-doc" data-id="${doc.id}">${icon("edit")} Edit details</button></div>`, "doc-preview-modal", null);
  const shell = byId("docPreviewShell");
  fitPreview(shell, renderDocument(doc, dossier));
}

function openIndexPreview() {
  openModal(`
    ${modalHeader("Dossier index", "The cover page.", `${dossier.persons.length} people · ${dossier.requirements.length} requirements · ${dossier.documents.length} drafts`)}
    <div class="doc-preview-shell" id="docPreviewShell"></div>
    <div class="modal__footer"><button class="btn btn--ghost form-actions__left" type="button" data-action="close-modal">Close</button><button class="btn btn--ink" type="button" data-action="download-index">${icon("download")} Download index PDF</button></div>`, "doc-preview-modal", null);
  fitPreview(byId("docPreviewShell"), renderIndexDocument(dossier));
}

async function openUploadPreview(uploadId) {
  const upload = dossier.uploads.find((item) => item.id === uploadId);
  if (!upload) return;
  const blob = await getOriginalFile(uploadId);
  if (!blob) {
    showToast("The original file is no longer available in this browser.", "error");
    return;
  }
  const url = URL.createObjectURL(blob);
  const isImage = String(upload.type || blob.type).startsWith("image/");
  const isPdf = String(upload.type || blob.type).includes("pdf");
  const requirement = getRequirement(upload.requirementId);
  const person = upload.personId ? dossier.persons.find((item) => item.id === upload.personId) : null;
  openModal(`
    ${modalHeader("Original file", upload.name, `${person ? personName(person) : "Household"} · ${requirement?.label || "Original"} · ${Math.max(1, Math.round(upload.size / 1024))} KB`)}
    <div class="doc-preview-shell" style="align-items:center"><div class="file-preview">${isImage ? `<img src="${url}" alt="${esc(upload.name)}">` : isPdf ? `<iframe src="${url}" title="${esc(upload.name)}"></iframe>` : `<div class="file-preview__fallback">${icon("file")}<p>${esc(upload.name)}</p><a href="${url}" target="_blank" rel="noreferrer">Open original ↗</a></div>`}</div></div>
    <div class="modal__footer"><button class="btn btn--danger form-actions__left" type="button" data-action="delete-upload" data-id="${upload.id}">${icon("trash")} Delete</button><button class="btn btn--ghost" type="button" data-action="download-upload" data-id="${upload.id}">${icon("download")} Download original</button><button class="btn btn--ink" type="button" data-action="close-modal">Close</button></div>`, "doc-preview-modal", () => URL.revokeObjectURL(url));
}

function openFilePicker(requirementId, personId) {
  filePickerContext = { requirementId, personId: personId || null };
  filePicker.accept = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx";
  filePicker.value = "";
  filePicker.click();
}

async function handleUploadedFiles(files) {
  if (!filePickerContext || !files?.length) return;
  const context = { ...filePickerContext };
  const added = [];
  for (const file of files) {
    if (file.size > 30 * 1024 * 1024) {
      showToast(`${file.name} is larger than 30 MB and was skipped.`, "error");
      continue;
    }
    const uploadId = uid("upload");
    await saveOriginalFile(uploadId, file);
    dossier.uploads.push({
      id: uploadId,
      requirementId: context.requirementId,
      personId: context.personId,
      name: file.name,
      type: file.type,
      size: file.size,
      addedAt: nowIso(),
    });
    added.push(file.name);
  }
  if (added.length) {
    saveDossier();
    renderApp();
    showToast(`${added.length} original ${added.length === 1 ? "file" : "files"} added.`);
  }
  filePickerContext = null;
}

async function deleteDocument(docId) {
  const doc = getDocument(docId);
  if (!doc) return;
  openConfirm("Delete draft?", `Remove <strong>${esc(doc.title || "this draft")}</strong> from the dossier? The original source data stays untouched.`, "Delete draft", async () => {
    dossier.documents = dossier.documents.filter((item) => item.id !== docId);
    saveDossier();
    renderApp();
    showToast("Draft deleted.");
  });
}

async function deleteUpload(uploadId) {
  const upload = dossier.uploads.find((item) => item.id === uploadId);
  if (!upload) return;
  openConfirm("Delete original?", `Remove <strong>${esc(upload.name)}</strong> from the dossier? The file is deleted from this browser’s local storage.`, "Delete original", async () => {
    await deleteOriginalFile(uploadId);
    dossier.uploads = dossier.uploads.filter((item) => item.id !== uploadId);
    saveDossier();
    renderApp();
    showToast("Original removed.");
  });
}

async function deletePerson(personId) {
  const person = dossier.persons.find((item) => item.id === personId);
  if (!person) return;
  if (dossier.persons.length === 1) {
    showToast("Keep at least one person in the dossier.", "error");
    return;
  }
  openConfirm("Remove person?", `Remove <strong>${esc(personName(person))}</strong> and every generated draft or uploaded original attached to them?`, "Remove person", async () => {
    const uploads = dossier.uploads.filter((upload) => upload.personId === personId);
    await Promise.all(uploads.map((upload) => deleteOriginalFile(upload.id)));
    dossier.uploads = dossier.uploads.filter((upload) => upload.personId !== personId);
    dossier.documents = dossier.documents.filter((doc) => doc.personId !== personId);
    dossier.persons = dossier.persons.filter((item) => item.id !== personId);
    saveDossier();
    renderApp();
    showToast(`${personName(person)} removed.`);
  });
}

async function deleteRequirement(requirementId) {
  const requirement = getRequirement(requirementId);
  if (!requirement) return;
  openConfirm("Delete requirement?", `Remove <strong>${esc(requirement.label)}</strong> and any drafts or originals attached to it?`, "Delete requirement", async () => {
    const uploads = dossier.uploads.filter((upload) => upload.requirementId === requirementId);
    await Promise.all(uploads.map((upload) => deleteOriginalFile(upload.id)));
    dossier.uploads = dossier.uploads.filter((upload) => upload.requirementId !== requirementId);
    dossier.documents = dossier.documents.filter((doc) => doc.requirementId !== requirementId);
    dossier.requirements = dossier.requirements.filter((item) => item.id !== requirementId);
    saveDossier();
    renderApp();
    showToast("Requirement deleted.");
  });
}

function restoreCountryKit() {
  const pack = getPack(dossier.countryCode);
  const source = dossier.type === "mortgage" ? pack.mortgage : pack.rental;
  const existingLabels = new Set(dossier.requirements.map((requirement) => requirement.label.toLowerCase()));
  const additions = source.filter((requirement) => !existingLabels.has(requirement.label.toLowerCase())).map((requirement) => ({ ...clone(requirement), id: uid("req") }));
  if (!additions.length) {
    showToast("The country kit is already fully represented.");
    return;
  }
  dossier.requirements.push(...additions);
  saveDossier();
  renderApp();
  showToast(`${additions.length} country-kit ${additions.length === 1 ? "requirement" : "requirements"} added.`);
}

async function downloadDoc(docId) {
  const doc = getDocument(docId);
  if (!doc) return;
  showProgress("Preparing PDF", "Rendering the A4 document…");
  updateProgress(20, "Rendering the A4 document…");
  try {
    const filename = await downloadDocumentPdf(doc, dossier);
    updateProgress(100, "Download started.");
    showToast(`Downloaded ${filename}.`);
  } catch {
    showToast("The PDF could not be rendered. Try opening the document again.", "error");
  } finally {
    hideProgress();
  }
}

async function downloadOriginal(uploadId) {
  const upload = dossier.uploads.find((item) => item.id === uploadId);
  if (!upload) return;
  const blob = await getOriginalFile(uploadId);
  if (!blob) {
    showToast("The original file is no longer available in this browser.", "error");
    return;
  }
  downloadBlob(blob, upload.name);
  showToast("Original file downloaded.");
}

async function downloadIndex() {
  showProgress("Preparing index", "Building the dossier cover…");
  try {
    const blob = await htmlToPdfBlob(renderIndexDocument(dossier));
    downloadBlob(blob, `${safeName(dossier.title)} - Dossier Index.pdf`);
    showToast("Dossier index downloaded.");
  } catch {
    showToast("The index could not be rendered.", "error");
  } finally {
    hideProgress();
  }
}

function updateDetailsFromForm(form) {
  const data = new FormData(form);
  dossier.context = {
    ...dossier.context,
    propertyAddress: String(data.get("propertyAddress") || ""),
    monthlyRent: String(data.get("monthlyRent") || ""),
    purchasePrice: String(data.get("purchasePrice") || ""),
    landlordName: String(data.get("landlordName") || ""),
    lenderName: String(data.get("lenderName") || ""),
    notaryName: String(data.get("notaryName") || ""),
    applicationDate: String(data.get("applicationDate") || ""),
  };
  saveDossier();
  showToast("Dossier context saved.");
}

async function runExport() {
  showProgress("Packing your dossier", "Rendering generated PDFs…");
  updateProgress(3, "Collecting the checklist…");
  try {
    const result = await exportDossierZip(dossier, ui.exportOptions, ({ percent, label }) => updateProgress(percent, label));
    downloadBlob(result.blob, result.filename);
    showToast(`ZIP ready: ${result.generatedCount} draft(s) and ${result.originalCount} original(s).`);
  } catch (error) {
    console.error(error);
    showToast("The ZIP could not be built. Try disabling PDF drafts to isolate the issue.", "error");
  } finally {
    setTimeout(hideProgress, 250);
  }
}

function renderLibrary() {
  const grid = byId("libraryGrid");
  if (!grid) return;
  grid.innerHTML = TEMPLATE_LIST.map((template) => `<article class="library-card"><div class="library-card__top"><div class="library-card__icon">${icon(template.icon)}</div><span class="library-card__category">${esc(template.category)}</span></div><div><h3>${esc(template.label)}</h3><p>${esc(template.description)}</p></div></article>`).join("");
}

function renderHeroDocs() {
  const container = byId("heroDocs");
  if (!container) return;
  heroSample = heroSample || buildSampleDossier();
  const picks = ["payslip", "id_card", "tax_notice"].map((templateId) => heroSample.documents.find((doc) => doc.templateId === templateId)).filter(Boolean);
  container.innerHTML = picks.slice(0, 3).map((doc) => `<div class="hero-paper"><span class="hero-paper__label">${esc(TEMPLATES[doc.templateId]?.label || "Draft")}</span><div class="hero-paper__scale">${renderDocument(doc, heroSample)}</div></div>`).join("");
}

function openTemplateStart() {
  if (!dossier) setupModal();
  else setupModal();
}

function handleAction(element, event) {
  const action = element.dataset.action;
  if (action === "modal-backdrop") {
    if (!event.target.closest(".modal")) closeModal();
    return;
  }
  if (action !== "search") event.preventDefault();
  if (action === "close-modal") {
    closeModal();
    return;
  }
  if (action === "start-dossier") {
    setupModal();
    return;
  }
  if (action === "open-sample") {
    loadSample();
    return;
  }
  if (action === "go-home") {
    goHome();
    return;
  }
  if (action === "toggle-sidebar") {
    appShell.classList.toggle("sidebar-open");
    return;
  }
  if (action === "nav") {
    ui.tab = element.dataset.tab || "overview";
    appShell.classList.remove("sidebar-open");
    renderApp();
    return;
  }
  if (action === "go-export") {
    ui.tab = "export";
    appShell.classList.remove("sidebar-open");
    renderApp();
    return;
  }
  if (action === "edit-dossier") {
    openDossierSettings();
    return;
  }
  if (action === "add-person") {
    openPersonModal(null, element.dataset.role || "coapplicant");
    return;
  }
  if (action === "edit-person") {
    openPersonModal(element.dataset.id);
    return;
  }
  if (action === "delete-person") {
    deletePerson(element.dataset.id);
    return;
  }
  if (action === "add-requirement") {
    openRequirementModal();
    return;
  }
  if (action === "edit-requirement") {
    openRequirementModal(element.dataset.id);
    return;
  }
  if (action === "delete-requirement") {
    deleteRequirement(element.dataset.id);
    return;
  }
  if (action === "restore-kit") {
    restoreCountryKit();
    return;
  }
  if (action === "category-filter") {
    ui.categoryFilter = element.dataset.category || "All";
    renderMain();
    return;
  }
  if (action === "doc-filter") {
    ui.docFilter = element.dataset.filter || "all";
    renderMain();
    return;
  }
  if (action === "slot-open") {
    const requirement = getRequirement(element.dataset.req);
    const personId = element.dataset.person || null;
    if (requirement?.templates.length) openGenerateModal({ reqId: requirement.id, personId });
    else openFilePicker(requirement.id, personId);
    return;
  }
  if (action === "upload-slot") {
    openFilePicker(element.dataset.req, element.dataset.person || null);
    return;
  }
  if (action === "generate-slot") {
    openGenerateModal({ reqId: element.dataset.req, personId: element.dataset.person || null });
    return;
  }
  if (action === "preview-doc") {
    openDocPreview(element.dataset.id);
    return;
  }
  if (action === "edit-doc") {
    const doc = getDocument(element.dataset.id);
    if (!doc) return;
    closeModal();
    openGenerateModal({ reqId: doc.requirementId, personId: doc.personId || null, editId: doc.id });
    return;
  }
  if (action === "download-doc") {
    downloadDoc(element.dataset.id);
    return;
  }
  if (action === "delete-doc") {
    deleteDocument(element.dataset.id);
    return;
  }
  if (action === "preview-upload") {
    openUploadPreview(element.dataset.id);
    return;
  }
  if (action === "download-upload") {
    downloadOriginal(element.dataset.id);
    return;
  }
  if (action === "delete-upload") {
    deleteUpload(element.dataset.id);
    return;
  }
  if (action === "preview-index") {
    openIndexPreview();
    return;
  }
  if (action === "download-index") {
    downloadIndex();
    return;
  }
  if (action === "export-zip") {
    runExport();
    return;
  }
  if (action === "preview-reset") {
    const previewPane = byId("generatePreview");
    if (!previewPane) return;
    const html = previewPane.querySelector(".doc-page")?.outerHTML;
    if (html) fitPreview(previewPane, html);
  }
}

document.addEventListener("click", (event) => {
  const element = event.target.closest("[data-action]");
  if (!element) return;
  handleAction(element, event);
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (form.id === "setupForm") {
    event.preventDefault();
    createFromSetup(form);
  } else if (form.id === "personForm") {
    event.preventDefault();
    handlePersonSubmit(form);
  } else if (form.id === "requirementForm") {
    event.preventDefault();
    handleRequirementSubmit(form);
  } else if (form.id === "dossierSettingsForm") {
    event.preventDefault();
    handleDossierSettings(form);
  } else if (form.id === "detailsForm") {
    event.preventDefault();
    updateDetailsFromForm(form);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches('[data-action="toggle-required"]')) {
    const requirement = getRequirement(target.dataset.id);
    if (requirement) {
      requirement.required = target.checked;
      saveDossier();
      renderApp();
    }
  }
  if (target.matches("[data-export-option]")) {
    ui.exportOptions[target.dataset.exportOption] = target.checked;
    saveUi();
    renderMain();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches('[data-search="documents"]')) {
    ui.docSearch = event.target.value;
    const cursor = event.target.selectionStart || ui.docSearch.length;
    renderMain();
    const input = byId("docSearch");
    if (input) {
      input.focus();
      input.setSelectionRange(cursor, cursor);
    }
  }
});

filePicker.addEventListener("change", async () => {
  try {
    await handleUploadedFiles([...filePicker.files]);
  } catch (error) {
    console.error(error);
    showToast("One or more files could not be stored locally.", "error");
  } finally {
    filePicker.value = "";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modalRoot.firstElementChild) closeModal();
});

window.addEventListener("beforeunload", () => {
  if (dossier) saveDossier(true);
});

function init() {
  loadUi();
  applyIcons();
  renderLibrary();
  renderHeroDocs();
  dossier = loadStored();
  const hash = window.location.hash;
  if (hash === "#sample") {
    dossier = buildSampleDossier();
    saveDossier(true);
    enterApp();
  } else if (hash === "#studio" && dossier) {
    enterApp();
  } else {
    landing.hidden = false;
    appShell.hidden = true;
    document.body.classList.remove("app-open");
  }
}

init();
