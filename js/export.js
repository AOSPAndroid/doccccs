import { renderDocument, renderIndexDocument } from "./documents.js";
import { roleLabel } from "./data.js";

const DB_NAME = "doccccs-files";
const STORE_NAME = "originals";
let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function storeRequest(mode, operation) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOriginalFile(id, file) {
  return storeRequest("readwrite", (store) => store.put({ id, blob: file, name: file.name, type: file.type, savedAt: new Date().toISOString() }));
}

export async function getOriginalFile(id) {
  const record = await storeRequest("readonly", (store) => store.get(id));
  return record?.blob || null;
}

export async function deleteOriginalFile(id) {
  return storeRequest("readwrite", (store) => store.delete(id));
}

export async function clearOriginalFiles() {
  return storeRequest("readwrite", (store) => store.clear());
}

export const safeName = (value, fallback = "document") => {
  const cleaned = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
  return cleaned || fallback;
};

export async function htmlToPdfBlob(html) {
  if (!window.html2canvas || !window.jspdf?.jsPDF) throw new Error("PDF libraries did not load.");
  const stage = document.getElementById("exportStage");
  if (!stage) throw new Error("Export stage is unavailable.");
  await document.fonts.ready;
  stage.innerHTML = html;
  const page = stage.querySelector(".doc-page");
  if (!page) throw new Error("Document page could not be rendered.");
  const images = [...page.querySelectorAll("img")];
  await Promise.all(images.map((image) => {
    if (image.complete) return image.decode?.().catch(() => {}) || Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
      setTimeout(resolve, 4000);
    });
  }));
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  let canvas;
  try {
    canvas = await window.html2canvas(page, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      useCORS: true,
    });
  } finally {
    stage.innerHTML = "";
  }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const image = canvas.toDataURL("image/jpeg", 0.91);
  pdf.addImage(image, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  return pdf.output("blob");
}

export async function renderDocPdfBlob(doc, dossier) {
  return htmlToPdfBlob(renderDocument(doc, dossier));
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadDocumentPdf(doc, dossier) {
  const person = dossier.persons.find((item) => item.id === doc.personId);
  const filename = `${safeName(person?.fullName || "Household")}_${safeName(doc.title || doc.templateId)}.pdf`;
  const blob = await renderDocPdfBlob(doc, dossier);
  downloadBlob(blob, filename);
  return filename;
}

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function requirementFolder(requirement) {
  return `${String(requirement.category || "Other").replace(/[^a-z0-9]+/gi, "_")}_${safeName(requirement.label, "Requirement")}`;
}

function docPeriodLabel(doc) {
  return doc.period || "single";
}

function buildManifest(dossier, entries) {
  const lines = ["Person,Role,Requirement,Source,Document,Period,File"];
  entries.forEach((entry) => lines.push([
    entry.person,
    entry.role,
    entry.requirement,
    entry.source,
    entry.document,
    entry.period,
    entry.file,
  ].map(csvCell).join(",")));
  return `${lines.join("\r\n")}\r\n`;
}

function readme(dossier, generatedCount, originalCount) {
  return `DOCCCCS DOSSIER EXPORT

Dossier: ${dossier.title}
Type: ${dossier.type === "mortgage" ? "Mortgage application" : "Rental application"}
Country: ${dossier.country}
Currency: ${dossier.currency}
Exported: ${new Date().toISOString()}

Contents
--------
- ${generatedCount} generated document draft(s) in PDF
- ${originalCount} uploaded original file(s), preserved with their original filename and extension
- 00_Dossier_Index.pdf (when enabled)
- manifest.csv (when enabled)

Source labels
-------------
Generated drafts are editable facsimiles prepared in Doccccs. They are not issuer-issued originals.
Uploaded originals are the files supplied by the user and are copied into the ZIP unchanged.

Before sending a dossier for a real application, verify names, dates, amounts and references, and use
an issuer-issued original wherever a landlord, lender, authority or other third party requires one.
`;
}

export async function exportDossierZip(dossier, options = {}, onProgress = () => {}) {
  if (!window.JSZip) throw new Error("ZIP library did not load.");
  const opts = {
    includeGenerated: options.includeGenerated !== false,
    includeOriginals: options.includeOriginals !== false,
    includeIndex: options.includeIndex !== false,
    includeManifest: options.includeManifest !== false,
  };
  const zip = new window.JSZip();
  const rootName = safeName(`${dossier.title} - Doccccs`, "Doccccs dossier");
  const root = zip.folder(rootName);
  const generated = opts.includeGenerated ? (dossier.documents || []) : [];
  const originals = opts.includeOriginals ? (dossier.uploads || []) : [];
  const totalSteps = generated.length + originals.length + (opts.includeIndex ? 1 : 0);
  let current = 0;
  const advance = (label) => {
    current += 1;
    onProgress({
      percent: totalSteps ? Math.min(92, Math.round((current / totalSteps) * 92)) : 88,
      label: label || "Packing dossier",
    });
  };
  const manifestEntries = [];
  const personFor = (personId) => dossier.persons.find((person) => person.id === personId);

  const requirementIndex = new Map();
  dossier.requirements.forEach((requirement, index) => requirementIndex.set(requirement.id, index));
  const folderFor = (requirement) => {
    const index = requirementIndex.get(requirement.id) ?? 99;
    return `${String(index + 1).padStart(2, "0")}_${requirementFolder(requirement)}`;
  };

  for (const doc of generated) {
    const person = personFor(doc.personId);
    const requirement = dossier.requirements.find((item) => item.id === doc.requirementId);
    const folder = folderFor(requirement || { id: doc.requirementId, label: "Other documents", category: "Other" });
    const personName = safeName(person?.fullName || "Household");
    const fileBase = `DRAFT_${safeName(doc.title || doc.templateId, "Document")}_${safeName(docPeriodLabel(doc))}`;
    onProgress({ percent: Math.min(92, Math.round(((current + 1) / Math.max(totalSteps, 1)) * 92)), label: `Rendering ${doc.title || "document"}…` });
    const blob = await renderDocPdfBlob(doc, dossier);
    const fileName = `${fileBase}.pdf`;
    root.file(`${folder}/${personName}/${fileName}`, blob);
    manifestEntries.push({
      person: person?.fullName || "Household",
      role: person ? roleLabel(person.role, dossier.type) : "Household",
      requirement: requirement?.label || "Other documents",
      source: "Generated draft",
      document: doc.title || doc.templateId,
      period: doc.period || "Single",
      file: `${folder}/${personName}/${fileName}`,
    });
    advance(`Rendered ${doc.title || "document"}`);
  }

  for (const upload of originals) {
    const blob = await getOriginalFile(upload.id);
    if (!blob) {
      onProgress({ percent: Math.min(92, Math.round(((current + 1) / Math.max(totalSteps, 1)) * 92)), label: `Skipping missing file ${upload.name}…` });
      current += 1;
      continue;
    }
    const person = personFor(upload.personId);
    const requirement = dossier.requirements.find((item) => item.id === upload.requirementId);
    const folder = folderFor(requirement || { id: upload.requirementId, label: "Originals", category: "Original" });
    const personName = safeName(person?.fullName || "Household");
    const originalName = safeName(upload.name, "original");
    const fileName = `ORIGINAL_${originalName}`;
    root.file(`${folder}/${personName}/${fileName}`, blob);
    manifestEntries.push({
      person: person?.fullName || "Household",
      role: person ? roleLabel(person.role, dossier.type) : "Household",
      requirement: requirement?.label || "Originals",
      source: "Uploaded original",
      document: upload.name,
      period: upload.period || "Original",
      file: `${folder}/${personName}/${fileName}`,
    });
    advance(`Added original ${upload.name}`);
  }

  if (opts.includeIndex) {
    onProgress({ percent: Math.min(94, Math.round(((current + 1) / Math.max(totalSteps, 1)) * 94)), label: "Building dossier index…" });
    const indexBlob = await htmlToPdfBlob(renderIndexDocument(dossier));
    root.file("00_Dossier_Index.pdf", indexBlob);
    advance("Built dossier index");
  }
  if (opts.includeManifest) {
    root.file("manifest.csv", buildManifest(dossier, manifestEntries));
  }
  root.file("README.txt", readme(dossier, generated.length, originals.length));
  onProgress({ percent: 96, label: "Compressing ZIP…" });
  const blob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (metadata) => onProgress({ percent: 96 + Math.round(metadata.percent / 30), label: "Compressing ZIP…" }),
  );
  const filename = `${safeName(dossier.title, "Dossier")} - Doccccs.zip`;
  onProgress({ percent: 100, label: "Dossier ready" });
  return { blob, filename, generatedCount: generated.length, originalCount: originals.length };
}
