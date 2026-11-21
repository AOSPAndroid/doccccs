import { TEMPLATES, templateLabel, roleLabel } from "./data.js";

const COUNTRY_ISO3 = {
  France: "FRA",
  "United Kingdom": "GBR",
  "United States": "USA",
  Germany: "DEU",
  Spain: "ESP",
  Italy: "ITA",
  Netherlands: "NLD",
  Portugal: "PRT",
  Belgium: "BEL",
  Canada: "CAN",
};

export const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const n = (value) => {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const safe = (value, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export function personFor(doc, dossier) {
  return dossier.persons.find((person) => person.id === doc.personId) || null;
}

export function money(dossier, value, digits = 2) {
  try {
    return new Intl.NumberFormat(dossier.locale || "en-GB", {
      style: "currency",
      currency: dossier.currency || "EUR",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n(value));
  } catch {
    return `${n(value).toFixed(digits)} ${dossier.currency || "EUR"}`;
  }
}

export function fmtDate(value, dossier, long = false) {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return safe(value);
  try {
    return new Intl.DateTimeFormat(dossier.locale || "en-GB", long
      ? { day: "2-digit", month: "long", year: "numeric" }
      : { day: "2-digit", month: "2-digit", year: "numeric" }).format(parsed);
  } catch {
    return value;
  }
}

export function fmtMonth(period, dossier, short = false) {
  if (!period) return "—";
  if (/^\d{4}$/.test(period)) return period;
  const parsed = new Date(`${period}-01T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return period;
  try {
    return new Intl.DateTimeFormat(dossier.locale || "en-GB", {
      month: short ? "short" : "long",
      year: "numeric",
    }).format(parsed);
  } catch {
    return period;
  }
}

export function periodDisplay(period, dossier) {
  if (!period) return "Single document";
  return /^\d{4}$/.test(period) ? `Year ${period}` : fmtMonth(period, dossier);
}

export function docDateForPeriod(templateId, period) {
  if (!period) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}$/.test(period)) return `${period}-12-31`;
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

const initials = (name) => String(name || "Applicant")
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

const nameOr = (person, fallback = "Applicant name") => safe(person?.fullName, fallback);

const hash = (value) => {
  let h = 2166136261;
  for (const char of String(value)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const docId = (doc) => `DOC-${hash(`${doc.id}${doc.templateId}${doc.period}`).toString(16).toUpperCase().padStart(8, "0").slice(0, 8)}`;

const personRole = (person, dossier) => person ? roleLabel(person.role, dossier.type) : "Household";

const docFooter = (doc, dossier) => `
  <footer class="doc-footer">
    <span><strong>Doccccs draft</strong> · prepared for dossier use · not an issuer-issued original</span>
    <span>${docId(doc)} · 01 / 01</span>
  </footer>`;

const qrSvg = (seed, dark = "#26332f") => {
  const size = 21;
  let state = hash(seed) || 17;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const isFinder = (x, y) => {
    if (x < 8 && y < 8) return true;
    if (x > size - 9 && y < 8) return true;
    if (x < 8 && y > size - 9) return true;
    return false;
  };
  let cells = "";
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!isFinder(x, y) && next() > 0.53) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg viewBox="0 0 21 21" fill="${dark}" shape-rendering="crispEdges" aria-hidden="true">${cells}${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}</svg>`;
};

const barcode = (seed) => {
  let state = hash(seed) || 71;
  let bars = "";
  for (let i = 0; i < 64; i += 1) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    const width = (state % 4) + 1;
    const height = 26 + ((state >> 5) % 13);
    bars += `<i style="width:${width}px;height:${height}px"></i>`;
  }
  return `<div class="doc-barcode">${bars}</div><div class="doc-barcode-label">${esc(docIdSeed(seed))}</div>`;
};

const docIdSeed = (seed) => `D${hash(seed).toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;

const signatureName = (name) => esc(name || "Signature");

const personAddress = (person, fallback = "Address to be confirmed") => safe(person?.address, fallback);

const identity = (doc, dossier) => personFor(doc, dossier);
const isFrance = (dossier) => dossier.countryCode === "fr";

const checkDigit = (value) => {
  const weights = [7, 3, 1];
  return String([...String(value)].reduce((sum, char, index) => {
    const number = /\d/.test(char) ? Number(char) : char === "<" ? 0 : char.charCodeAt(0) - 55;
    return sum + number * weights[index % 3];
  }, 0) % 10);
};

const mrzName = (name) => {
  const parts = String(name || "APPLICANT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .trim()
    .split(/\s+/);
  const surname = parts.length > 1 ? parts.at(-1) : parts[0] || "APPLICANT";
  const given = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  return `${surname.replaceAll(" ", "<")}<<${given.replaceAll(" ", "<")}`.padEnd(39, "<").slice(0, 39);
};

const mrzDate = (value) => {
  if (!value) return "000000";
  return value.replaceAll("-", "").slice(2, 8);
};

const passportMrz = (person, data, dossier) => {
  const country = COUNTRY_ISO3[person?.nationality || dossier.country] || "UTO";
  const number = (data.mrzNumber || data.documentNumber || "0000000").toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(9, "<").slice(0, 9);
  const line1 = `P<${country}${mrzName(person?.fullName)}`.padEnd(44, "<").slice(0, 44);
  const line2core = `${number}${country}${mrzDate(person?.birthDate)}${person?.sex === "M" ? "M" : person?.sex === "F" ? "F" : "<"}${mrzDate(data.expiryDate)}`;
  const line2 = `${number}${checkDigit(number)}${country}${mrzDate(person?.birthDate)}${checkDigit(mrzDate(person?.birthDate))}${person?.sex === "M" ? "M" : person?.sex === "F" ? "F" : "<"}${mrzDate(data.expiryDate)}${checkDigit(mrzDate(data.expiryDate))}<<<<<<<<<<<<<<<0`.padEnd(44, "<").slice(0, 44);
  return `${line1}\n${line2}`;
};

const idMrz = (person, data, dossier) => {
  const country = COUNTRY_ISO3[person?.nationality || dossier.country] || "UTO";
  const number = (data.documentNumber || "0000000").toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(9, "<").slice(0, 9);
  const birth = mrzDate(person?.birthDate);
  const expiry = mrzDate(data.expiryDate);
  return `ID${country}${number}${checkDigit(number)}${birth}${checkDigit(birth)}${person?.sex === "F" ? "F" : "M"}${expiry}${checkDigit(expiry)}${country}<<<<<<<<<<<<<<<<<<<<`.slice(0, 44);
};

const idMrzBack = (person, data, dossier) => {
  const country = COUNTRY_ISO3[person?.nationality || dossier.country] || "UTO";
  const number = (data.documentNumber || "0000000").toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(9, "<").slice(0, 9);
  const birth = mrzDate(person?.birthDate);
  const expiry = mrzDate(data.expiryDate);
  return `ID${country}${birth}${checkDigit(birth)}${expiry}${checkDigit(expiry)}${number}${checkDigit(number)}${person?.sex === "F" ? "F" : "M"}<<<${"<".repeat(11)}`.padEnd(44, "<").slice(0, 44);
};

const portrait = (person, data) => {
  const src = data.portrait || "assets/portrait-placeholder.png";
  return `<img src="${esc(src)}" alt="Portrait of ${esc(nameOr(person))}">`;
};

const docTopline = (title, subtitle, issuer, address, reference, date, dossier) => `
  <div class="doc-topline">
    <div class="doc-logo-lockup">
      <div class="doc-logo-mark">${esc(String(issuer || "D").charAt(0))}</div>
      <div>
        <div class="doc-company-name">${esc(issuer || "Issuer name")}</div>
        <div class="doc-company-sub">${esc(address || "Issuer address")}</div>
      </div>
    </div>
    <div class="doc-topline__right"><strong>${esc(title)}</strong><br>${esc(subtitle || "Supporting document")}<br>${esc(reference ? `Ref. ${reference}` : "")}<br>${esc(fmtDate(date, dossier))}</div>
  </div>`;

const signatureBlock = (leftLabel, rightLabel, leftName, rightName, dossier, date) => `
  <div class="doc-signature-area">
    <div class="doc-signature">
      <div class="doc-signature__label">${esc(leftLabel)}</div>
      <div class="doc-signature__name">${signatureName(leftName)}</div>
      <div class="doc-signature__small">${esc(fmtDate(date, dossier))}</div>
    </div>
    <div class="doc-signature">
      <div class="doc-signature__label">${esc(rightLabel)}</div>
      <div class="doc-signature__name">${signatureName(rightName)}</div>
      <div class="doc-signature__small">${esc(fmtDate(date, dossier))}</div>
    </div>
  </div>`;

export function renderDocument(doc, dossier) {
  const template = TEMPLATES[doc.templateId] || TEMPLATES.generic;
  const person = personFor(doc, dossier);
  const data = doc.data || {};
  const renderer = {
    id_card: renderIdCard,
    passport: renderPassport,
    employment_contract: renderEmploymentContract,
    employment_letter: renderEmploymentLetter,
    payslip: renderPayslip,
    tax_notice: renderTaxNotice,
    rent_receipt: renderRentReceipt,
    accommodation_certificate: renderAccommodationCertificate,
    proof_of_address: renderProofOfAddress,
    bank_statement: renderBankStatement,
    savings_statement: renderSavingsStatement,
    loan_schedule: renderLoanSchedule,
    business_registration: renderBusinessRegistration,
    urssaf_declaration: renderTurnoverDeclaration,
    annual_accounts: renderAnnualAccounts,
    marital_status: renderMaritalStatus,
    purchase_agreement: renderPurchaseAgreement,
    renovation_quote: renderRenovationQuote,
    guarantor_letter: renderGuarantorLetter,
    reference_letter: renderReferenceLetter,
    income_summary: renderIncomeSummary,
    application_letter: renderApplicationLetter,
    generic: renderGeneric,
  }[doc.templateId] || renderGeneric;
  return `<div class="doc-page" data-doc-template="${esc(doc.templateId)}">${renderer(doc, dossier, person, data, template)}${docFooter(doc, dossier)}</div>`;
}

function renderIdCard(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const country = fr ? "RÉPUBLIQUE FRANÇAISE" : dossier.country.toUpperCase();
  const countrySub = fr ? "RÉPUBLIQUE FRANÇAISE · FRENCH REPUBLIC" : "IDENTITY DOCUMENT";
  const docTitle = fr ? "CARTE NATIONALE D’IDENTITÉ" : "IDENTITY CARD";
  const docSub = fr ? "IDENTITY CARD" : "NATIONAL IDENTITY DOCUMENT";
  return `
    <div class="id-sheet">
      <div class="id-sheet__head"><h1>${fr ? "Pièce d’identité" : "Identity document"}</h1><span>${esc(nameOr(person))} · ${esc(dossier.country)}</span></div>
      <div class="id-copy">
        <div class="id-copy__label">${fr ? "Recto" : "Front"}</div>
        <div class="id-card">
          <div class="id-card__tricolor"></div>
          <div class="id-card__head">
            <div class="id-card__country">${esc(country)}<small>${fr ? "Identité · Identity" : countrySub}</small></div>
            <div class="id-card__type">${esc(docTitle)}<span>${esc(docSub)}</span></div>
          </div>
          <div class="id-card__body">
            <div class="id-card__photo">${portrait(person, data)}</div>
            <div class="id-card__fields">
              <div class="id-card__field"><span>${fr ? "Nom" : "Surname"}</span><strong>${esc((nameOr(person).split(" ").at(-1) || "").toUpperCase())}</strong></div>
              <div class="id-card__field"><span>${fr ? "Prénoms" : "Given names"}</span><strong>${esc(nameOr(person).split(" ").slice(0, -1).join(" "))}</strong></div>
              <div class="id-card__field"><span>${fr ? "Sexe" : "Sex"}</span><strong>${esc(person?.sex || "—")}</strong></div>
              <div class="id-card__field"><span>${fr ? "Nationalité" : "Nationality"}</span><strong>${esc(person?.nationality || dossier.country)}</strong></div>
              <div class="id-card__field"><span>${fr ? "Né(e) le" : "Date of birth"}</span><strong>${esc(fmtDate(person?.birthDate, dossier))}</strong></div>
              <div class="id-card__field"><span>${fr ? "À" : "Place of birth"}</span><strong>${esc(person?.birthPlace || "—")}</strong></div>
              <div class="id-card__field id-card__field--full"><span>${fr ? "Numéro du document" : "Document number"}</span><strong class="id-card__number">${esc(data.documentNumber || "—")}</strong></div>
            </div>
          </div>
          <div class="id-card__signature">${signatureName(person?.fullName)}</div>
          <div class="id-card__mrz">${esc(idMrz(person, data, dossier))}</div>
        </div>
      </div>
      <div class="id-copy">
        <div class="id-copy__label">${fr ? "Verso" : "Back"}</div>
        <div class="id-card">
          <div class="id-card__tricolor"></div>
          <div class="id-card__head">
            <div class="id-card__country">${esc(country)}<small>${fr ? "République française" : dossier.country}</small></div>
            <div class="id-card__type">${fr ? "CARTE D’IDENTITÉ" : "ID CARD"}<span>${fr ? "Recto-verso" : "Front / back"}</span></div>
          </div>
          <div class="id-card__back-title">${fr ? "Informations complémentaires" : "Additional information"}</div>
          <div class="id-card__back-grid">
            <div class="id-card__address"><span>${fr ? "Adresse" : "Address"}</span>${esc(personAddress(person))}<br><br><span>${fr ? "Autorité de délivrance" : "Issuing authority"}</span>${esc(data.authority || "—")}</div>
            <div class="id-card__back-note">${fr ? "Document généré pour un dossier de candidature. Vérifiez les informations auprès du document original." : "Generated document for application-file use. Verify against the issuer-issued original."}<br><br><span>${fr ? "Délivrée le" : "Issued"}</span> ${esc(fmtDate(data.issueDate, dossier))}<br><span>${fr ? "Valable jusqu’au" : "Valid until"}</span> ${esc(fmtDate(data.expiryDate, dossier))}</div>
          </div>
          <div class="id-card__back-mrz">${esc(idMrz(person, data, dossier))}<br>${esc(idMrzBack(person, data, dossier))}</div>
        </div>
      </div>
      <div class="doc-legal">${fr ? "Fac-similé de pièce d’identité généré à partir des informations saisies dans Doccccs. Il ne remplace pas le document officiel délivré par l’autorité compétente." : "Identity-card facsimile generated from values entered in Doccccs. It does not replace the official document issued by the competent authority."}</div>
    </div>`;
}

function renderPassport(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const country = fr ? "RÉPUBLIQUE FRANÇAISE" : dossier.country.toUpperCase();
  const countryEn = fr ? "FRENCH REPUBLIC" : dossier.country.toUpperCase();
  const mrz = passportMrz(person, data, dossier);
  return `
    <div class="passport-page">
      <div class="passport-head">
        <div class="passport-head__country">${esc(country)}<small>${esc(countryEn)} · ${fr ? "Passeport" : "Passport"}</small></div>
        <div class="passport-crest">${esc((COUNTRY_ISO3[dossier.country] || "DOC").slice(0, 3))}</div>
        <div class="passport-type"><strong>${fr ? "PASSEPORT" : "PASSPORT"}</strong><br>${fr ? "Type" : "Type"} P<br>${fr ? "Pays" : "Country"} ${esc(COUNTRY_ISO3[dossier.country] || "UTO")}</div>
      </div>
      <div class="passport-body">
        <div class="passport-photo">${portrait(person, data)}</div>
        <div>
          <div class="passport-fields">
            <div class="passport-field passport-field--full"><span>${fr ? "Nom / prénoms" : "Surname / given names"}</span><strong>${esc(nameOr(person).toUpperCase())}</strong></div>
            <div class="passport-field"><span>${fr ? "Nationalité" : "Nationality"}</span><strong>${esc((person?.nationality || dossier.country).toUpperCase())}</strong></div>
            <div class="passport-field"><span>${fr ? "Date de naissance" : "Date of birth"}</span><strong>${esc(fmtDate(person?.birthDate, dossier))}</strong></div>
            <div class="passport-field"><span>${fr ? "Lieu de naissance" : "Place of birth"}</span><strong>${esc(person?.birthPlace || "—")}</strong></div>
            <div class="passport-field"><span>${fr ? "Sexe" : "Sex"}</span><strong>${esc(person?.sex || "—")}</strong></div>
            <div class="passport-field"><span>${fr ? "Numéro du passeport" : "Passport number"}</span><strong class="doc-mono">${esc(data.documentNumber || "—")}</strong></div>
            <div class="passport-field"><span>${fr ? "Autorité" : "Authority"}</span><strong>${esc(data.authority || "—")}</strong></div>
            <div class="passport-field"><span>${fr ? "Date de délivrance" : "Date of issue"}</span><strong>${esc(fmtDate(data.issueDate, dossier))}</strong></div>
            <div class="passport-field"><span>${fr ? "Date d’expiration" : "Date of expiry"}</span><strong>${esc(fmtDate(data.expiryDate, dossier))}</strong></div>
          </div>
          <div class="passport-signature"><span>${fr ? "Signature du titulaire" : "Holder’s signature"}</span><strong>${signatureName(person?.fullName)}</strong></div>
        </div>
      </div>
      <div class="passport-foot"><span>${fr ? "Ce document est un fac-similé de démonstration généré par Doccccs." : "This document is a generated facsimile for dossier use."}</span><span>${esc(docId(doc))}</span></div>
      <div class="passport-mrz">${esc(mrz)}</div>
    </div>
    <div class="doc-legal">${fr ? "Zone de lecture automatique calculée au format TD3. Vérifiez le document original avant dépôt." : "Machine-readable zone generated in TD3 layout. Check the issuer-issued original before submission."}</div>`;
}

function renderPayslip(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const gross = n(data.grossMonthly);
  const net = n(data.netMonthly);
  const bonus = n(data.bonus);
  const overtime = n(data.overtime);
  const base = Math.max(0, gross - bonus - overtime);
  const deductions = Math.max(0, gross - net);
  const health = deductions * 0.34;
  const pension = deductions * 0.41;
  const tax = deductions * 0.16;
  const otherDeductions = Math.max(0, deductions - health - pension - tax);
  const period = doc.period || "";
  const payDate = data.payDate || docDateForPeriod("payslip", period);
  return `
    <div class="payslip-header">
      <div class="payslip-header__top">
        <div class="payslip-company"><div class="payslip-company__logo">${esc(String(data.employerName || "E").charAt(0))}</div><div><strong>${esc(data.employerName || "Employer name")}</strong><span>${esc(data.employerAddress || "Employer address")}<br>SIRET 824 519 662 00027 · APE 6201Z</span></div></div>
        <div class="payslip-title"><span>${fr ? "Document de paie" : "Pay statement"}</span><h1>${fr ? "BULLETIN DE PAIE" : "PAYSLIP"}</h1><span>${esc(periodDisplay(period, dossier))}</span></div>
      </div>
    </div>
    <div class="payslip-info">
      <div class="payslip-info__block"><span>${fr ? "Salarié" : "Employee"}</span><strong>${esc(nameOr(person))}</strong><small>${esc(personAddress(person))}<br>${fr ? "N° sécurité sociale" : "Social security no."} ${esc(data.socialNumber || "—")}</small></div>
      <div class="payslip-info__block payslip-info__block--dark"><span>${fr ? "Emploi" : "Employment"}</span><strong>${esc(data.jobTitle || "Job title")}</strong><small>${fr ? "N° salarié" : "Employee no."} ${esc(data.employeeNumber || "—")}<br>${esc(data.employerName || "")}</small></div>
    </div>
    <div class="payslip-summary">
      <div class="payslip-summary__item"><span>${fr ? "Brut mensuel" : "Gross pay"}</span><strong>${esc(money(dossier, gross))}</strong></div>
      <div class="payslip-summary__item"><span>${fr ? "Cotisations" : "Contributions"}</span><strong>${esc(money(dossier, deductions))}</strong></div>
      <div class="payslip-summary__item payslip-summary__item--grand"><span>${fr ? "Net à payer" : "Net pay"}</span><strong>${esc(money(dossier, net))}</strong></div>
    </div>
    <table class="doc-table payslip-table" style="margin-top:13px">
      <thead><tr><th>${fr ? "Rubrique" : "Description"}</th><th>${fr ? "Base" : "Base"}</th><th>${fr ? "Taux" : "Rate"}</th><th class="num">${fr ? "Gains" : "Earnings"}</th><th class="num">${fr ? "Retenues" : "Deductions"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead>
      <tbody>
        <tr class="section-row"><td colspan="6">${fr ? "Rémunération" : "Earnings"}</td></tr>
        <tr><td>${fr ? "Salaire de base" : "Base salary"}</td><td>151.67 h</td><td>—</td><td class="num">${esc(money(dossier, base))}</td><td class="num">—</td><td class="num">${esc(money(dossier, base))}</td></tr>
        <tr><td>${fr ? "Prime exceptionnelle" : "Performance bonus"}</td><td>—</td><td>—</td><td class="num">${esc(money(dossier, bonus))}</td><td class="num">—</td><td class="num">${esc(money(dossier, bonus))}</td></tr>
        <tr><td>${fr ? "Heures supplémentaires" : "Overtime"}</td><td>${overtime ? "8 h" : "—"}</td><td>125%</td><td class="num">${esc(money(dossier, overtime))}</td><td class="num">—</td><td class="num">${esc(money(dossier, overtime))}</td></tr>
        <tr class="section-row"><td colspan="6">${fr ? "Cotisations et contributions" : "Contributions and deductions"}</td></tr>
        <tr><td>${fr ? "Santé / prévoyance" : "Health / insurance"}</td><td>${esc(money(dossier, gross))}</td><td>—</td><td class="num">—</td><td class="num">${esc(money(dossier, health))}</td><td class="num">${esc(money(dossier, -health))}</td></tr>
        <tr><td>${fr ? "Retraite" : "Pension"}</td><td>${esc(money(dossier, gross))}</td><td>—</td><td class="num">—</td><td class="num">${esc(money(dossier, pension))}</td><td class="num">${esc(money(dossier, -pension))}</td></tr>
        <tr><td>${fr ? "Impôt / CSG" : "Income tax / social tax"}</td><td>${esc(money(dossier, gross))}</td><td>—</td><td class="num">—</td><td class="num">${esc(money(dossier, tax))}</td><td class="num">${esc(money(dossier, -tax))}</td></tr>
        <tr><td>${fr ? "Autres retenues" : "Other deductions"}</td><td>${esc(money(dossier, gross))}</td><td>—</td><td class="num">—</td><td class="num">${esc(money(dossier, otherDeductions))}</td><td class="num">${esc(money(dossier, -otherDeductions))}</td></tr>
        <tr class="strong"><td colspan="5">${fr ? "Net à payer avant impôt" : "Net pay before tax"}</td><td class="num">${esc(money(dossier, net))}</td></tr>
      </tbody>
    </table>
    <div class="payslip-bank"><span>${fr ? "Règlement par virement" : "Payment by transfer"} · ${esc(fmtDate(payDate, dossier))}</span><strong>${esc(data.iban || "IBAN —")}</strong></div>
    <div class="payslip-ytd">
      <div class="payslip-ytd__title">${fr ? "Cumul annuel" : "Year-to-date summary"}</div>
      <div class="payslip-ytd__grid">
        <div><span>${fr ? "Brut cumulé" : "Gross YTD"}</span><strong>${esc(money(dossier, gross * (Number(String(period).slice(5, 7)) || 12)))}</strong></div>
        <div><span>${fr ? "Net cumulé" : "Net YTD"}</span><strong>${esc(money(dossier, net * (Number(String(period).slice(5, 7)) || 12)))}</strong></div>
        <div><span>${fr ? "Net imposable" : "Taxable YTD"}</span><strong>${esc(money(dossier, net * 1.02 * (Number(String(period).slice(5, 7)) || 12)))}</strong></div>
      </div>
      <div class="payslip-ytd__meta"><span>${fr ? "Convention collective" : "Collective agreement"} : Syntec</span><span>${fr ? "Statut" : "Status"} : ${fr ? "Cadre" : "Employee"}</span><span>${fr ? "Congés acquis" : "Leave accrued"} : 18.5 ${fr ? "jours" : "days"}</span></div>
    </div>
    <div class="payslip-note">${fr ? "Le net à payer est indicatif et correspond aux données saisies dans le générateur. Les taux de cotisation sont simplifiés pour la maquette." : "Net pay is indicative and follows the values entered in the builder. Contribution lines are simplified for layout purposes."}</div>
    <div class="doc-issuer-row">
      <div class="doc-issuer-note">${fr ? "Ce bulletin est une maquette éditable. Conservez le bulletin original de l’employeur pour toute vérification." : "This pay statement is an editable draft. Keep the employer-issued original for verification."}</div>
      <div class="doc-stamp"><span>${fr ? "DOCUMENT DE PAIE" : "PAYROLL"}<br>${esc((data.employerName || "").toUpperCase())}</span></div>
    </div>`;
}

function renderTaxNotice(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const year = data.fiscalYear || doc.period || String(new Date().getFullYear() - 1);
  return `
    <div class="tax-page">
      <div class="tax-masthead">
        <div class="tax-republic"><div class="tax-republic__flag"></div><div class="tax-republic__name">${fr ? "RÉPUBLIQUE FRANÇAISE" : dossier.country.toUpperCase()}<small>${fr ? "Finances publiques" : "Revenue authority"}</small></div></div>
        <div class="tax-title"><span>${fr ? "Avis d’imposition" : "Income tax assessment"}</span><h1>${fr ? "AVIS D’IMPÔT SUR LE REVENU" : "INCOME TAX NOTICE"}</h1><small>${fr ? "Exercice fiscal" : "Tax year"} ${esc(year)}</small></div>
      </div>
      <div class="tax-address"><strong>${esc(nameOr(person))}</strong><br>${esc(personAddress(person))}<br>${fr ? "Référence de l’avis" : "Notice reference"} : ${esc(data.taxReference || "—")}</div>
      <div class="tax-summary">
        <div class="tax-summary__item tax-summary__item--primary"><span>${fr ? "Revenu fiscal de référence" : "Reference income"}</span><strong>${esc(money(dossier, data.referenceIncome, 0))}</strong><small>${fr ? "Base utilisée pour les justificatifs" : "Income used for assessment"}</small></div>
        <div class="tax-summary__item"><span>${fr ? "Impôt sur le revenu" : "Income tax due"}</span><strong>${esc(money(dossier, data.taxDue, 0))}</strong><small>${fr ? "Montant après crédits" : "Amount after credits"}</small></div>
        <div class="tax-summary__item"><span>${fr ? "Parts / situation" : "Tax parts / status"}</span><strong>${esc(data.parts || "1")}</strong><small>${fr ? "Déclaration commune" : "Filing status supplied"}</small></div>
      </div>
      <div class="doc-spacer-18"></div>
      <div class="doc-box doc-box--accent"><div class="doc-box__title">${fr ? "Détail du calcul" : "Assessment detail"}</div><p>${fr ? "Le revenu fiscal de référence et l’impôt sont calculés à partir des éléments déclarés. Ce document constitue une maquette d’avis destinée au dossier." : "The reference income and tax figures are based on the values entered. This notice is a dossier facsimile."}</p></div>
      <table class="doc-table tax-income-table" style="margin-top:15px">
        <thead><tr><th>${fr ? "Élément" : "Item"}</th><th class="num">${fr ? "Montant" : "Amount"}</th><th>${fr ? "Observation" : "Note"}</th></tr></thead>
        <tbody>
          <tr><td>${fr ? "Revenus déclarés" : "Reported income"}</td><td class="num">${esc(money(dossier, data.referenceIncome))}</td><td>${fr ? "Salaires, revenus assimilés" : "Salary and related income"}</td></tr>
          <tr><td>${fr ? "Revenu imposable" : "Taxable income"}</td><td class="num">${esc(money(dossier, data.taxableIncome))}</td><td>${fr ? "Après abattements" : "After allowances"}</td></tr>
          <tr><td>${fr ? "Impôt sur le revenu" : "Income tax"}</td><td class="num">${esc(money(dossier, data.taxDue))}</td><td>${fr ? "Montant dû" : "Amount due"}</td></tr>
          <tr><td>${fr ? "Revenu fiscal de référence" : "Reference income"}</td><td class="num">${esc(money(dossier, data.referenceIncome))}</td><td>${fr ? "Indicateur de ressources" : "Income indicator"}</td></tr>
        </tbody>
      </table>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:14px">
        <div class="doc-meta"><span>${fr ? "Taux de prélèvement" : "Withholding rate"}</span><strong>${esc((data.referenceIncome ? ((n(data.taxDue) / n(data.referenceIncome)) * 100).toFixed(1) : "0") + " %")}</strong></div>
        <div class="doc-meta"><span>${fr ? "Mensualité estimée" : "Estimated monthly"}</span><strong>${esc(money(dossier, n(data.taxDue) / 12))}</strong></div>
        <div class="doc-meta"><span>${fr ? "Prochaine échéance" : "Next instalment"}</span><strong>${fr ? "15 du mois" : "15th of month"}</strong></div>
      </div>
      <div class="doc-box" style="margin-top:11px"><div class="doc-box__title">${fr ? "Situation déclarée" : "Declared situation"}</div><p>${fr ? `Foyer fiscal composé de ${esc(data.parts || "1")} part(s). Les revenus de référence retenus pour le calcul sont ceux déclarés au titre de l’année ${esc(year)}. Le montant d’impôt indiqué tient compte des crédits et réductions disponibles dans la simulation.` : `Tax household of ${esc(data.parts || "1")} part(s). The reference income used for the calculation is the income reported for ${esc(year)}. The amount shown includes available credits and reliefs in the simulation.`}</p></div>
      <div class="doc-small doc-muted" style="margin-top:10px">${fr ? `Service gestionnaire : ${esc(data.taxOffice || "—")} · ${esc(fmtDate(data.issueDate, dossier))}` : `Issuing office: ${esc(data.taxOffice || "—")} · ${esc(fmtDate(data.issueDate, dossier))}`}</div>
      <div class="tax-barcode-row">
        <div class="tax-note">${fr ? "Document émis pour le dossier. Vérifiez les montants et références sur l’avis original de la DGFiP." : "Dossier draft. Verify amounts and references against the authority-issued original."}<br><br>${fr ? "Service gestionnaire" : "Issuing office"} : ${esc(data.taxOffice || "—")}<br>${fr ? "Date d’établissement" : "Issue date"} : ${esc(fmtDate(data.issueDate, dossier))}</div>
        <div><div class="doc-code">${qrSvg(doc.id + "tax")}</div><div class="doc-tiny doc-muted doc-center">${esc(data.taxReference || "")}</div></div>
      </div>
      <div class="doc-legal">${fr ? "Avis d’imposition sur le revenu — maquette générée par Doccccs. Ce document n’est pas émis par l’administration fiscale." : "Income tax notice facsimile generated by Doccccs. This document is not issued by the tax authority."}</div>
    </div>`;
}

function renderRentReceipt(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const rent = n(data.monthlyRent);
  const charges = n(data.monthlyCharges);
  const total = rent + charges;
  const period = doc.period || "";
  return `
    <div class="receipt-page">
      <div class="receipt-masthead">
        <div class="receipt-title"><div class="doc-kicker">${fr ? "Gestion locative" : "Rental evidence"}</div><h1>${fr ? "QUITTANCE DE LOYER" : "RENT RECEIPT"}</h1><div class="doc-muted doc-small">${esc(periodDisplay(period, dossier))}</div></div>
        <div class="receipt-number">${fr ? "N° de quittance" : "Receipt no."}<br><strong>QT-${esc(period.replaceAll("-", "") || "000000")}-01</strong><br>${fr ? "Émise le" : "Issued"} ${esc(fmtDate(data.paymentDate || docDateForPeriod("rent_receipt", period), dossier))}</div>
      </div>
      <div class="receipt-parties">
        <div class="receipt-party"><div class="receipt-party__title">${fr ? "Bailleur / mandataire" : "Landlord / agent"}</div><strong>${esc(data.landlordName || "Landlord")}</strong><p>${esc(data.landlordAddress || "Landlord address")}</p></div>
        <div class="receipt-party"><div class="receipt-party__title">${fr ? "Locataire" : "Tenant"}</div><strong>${esc(nameOr(person))}</strong><p>${esc(personAddress(person))}</p></div>
      </div>
      <div class="receipt-property"><span>${fr ? "Bien loué" : "Rented property"}</span><strong>${esc(data.propertyAddress || dossier.context?.propertyAddress || "Property address")}</strong></div>
      <div class="receipt-statement">${fr ? "Je soussigné(e), agissant en qualité de bailleur ou de mandataire, reconnais avoir reçu de" : "I, acting as landlord or agent, confirm receipt from"} <strong>${esc(nameOr(person))}</strong> ${fr ? "la somme ci-dessous au titre du loyer et des charges pour la période indiquée. Le paiement solde l’intégralité des sommes dues pour cette période." : "of the amount below for rent and charges for the stated period. The payment settles the amount due for that period."}</div>
      <table class="doc-table receipt-table">
        <thead><tr><th>${fr ? "Désignation" : "Description"}</th><th>${fr ? "Période" : "Period"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead>
        <tbody>
          <tr><td>${fr ? "Loyer mensuel" : "Monthly rent"}</td><td>${esc(periodDisplay(period, dossier))}</td><td class="num">${esc(money(dossier, rent))}</td></tr>
          <tr><td>${fr ? "Charges locatives" : "Property charges"}</td><td>${esc(periodDisplay(period, dossier))}</td><td class="num">${esc(money(dossier, charges))}</td></tr>
          <tr class="strong"><td colspan="2">${fr ? "Total reçu" : "Total received"}</td><td class="num">${esc(money(dossier, total))}</td></tr>
        </tbody>
      </table>
      <div class="receipt-payment">
        <div class="receipt-payment__item"><span>${fr ? "Mode de paiement" : "Payment method"}</span><strong>${esc(data.paymentMethod || "Bank transfer")}</strong></div>
        <div class="receipt-payment__item"><span>${fr ? "Date de valeur" : "Value date"}</span><strong>${esc(fmtDate(data.paymentDate || docDateForPeriod("rent_receipt", period), dossier))}</strong></div>
      </div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:12px">
        <div class="doc-meta"><span>${fr ? "Dépôt de garantie" : "Security deposit"}</span><strong>${esc(money(dossier, total * 2))}</strong></div>
        <div class="doc-meta"><span>${fr ? "Prochaine échéance" : "Next payment"}</span><strong>${fr ? "1er du mois" : "1st of month"}</strong></div>
        <div class="doc-meta"><span>${fr ? "Solde" : "Balance"}</span><strong>${fr ? "0,00" : "0.00"} ${esc(dossier.currency)}</strong></div>
      </div>
      <div class="doc-box" style="margin-top:11px"><div class="doc-box__title">${fr ? "Détail des charges" : "Charge breakdown"}</div><table class="doc-table doc-table--dense"><tbody><tr><td>${fr ? "Eau froide" : "Cold water"}</td><td class="num">${esc(money(dossier, charges * 0.31))}</td></tr><tr><td>${fr ? "Entretien des parties communes" : "Common-area maintenance"}</td><td class="num">${esc(money(dossier, charges * 0.44))}</td></tr><tr><td>${fr ? "Ordures ménagères" : "Household waste"}</td><td class="num">${esc(money(dossier, charges * 0.25))}</td></tr></tbody></table></div>
      <div class="receipt-sign">
        <div class="receipt-sign__text">${fr ? "La présente quittance vaut reçu pour la période indiquée. Elle ne préjuge pas des sommes dues au titre d’autres périodes." : "This receipt covers the period shown and does not discharge amounts due for other periods."}<br><br>${fr ? "Fait pour servir et valoir ce que de droit." : "Issued for the purpose required."}</div>
        <div class="receipt-sign__box"><span>${fr ? "Signature du bailleur" : "Landlord signature"}</span><strong>${esc(data.landlordSignature || data.landlordName || "Signature")}</strong></div>
      </div>
      <div class="doc-legal">${fr ? "Quittance de loyer générée pour le dossier. Le bailleur ou son mandataire doit vérifier et compléter les informations avant utilisation." : "Rent receipt generated for the dossier. The landlord or agent should verify and complete the information before use."}</div>
    </div>`;
}

function renderAccommodationCertificate(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="host-page">
      <div class="host-letterhead">
        <div class="host-letterhead__top"><div><div class="doc-kicker">${fr ? "Attestation sur l’honneur" : "Accommodation evidence"}</div><div class="host-name">${esc(data.hostName || "Host name")}</div><div class="doc-small doc-muted">${esc(data.hostAddress || "Host address")}</div></div><div class="host-contact">${fr ? "Téléphone" : "Phone"} : ${esc(data.hostPhone || "—")}<br>${fr ? "Date d’émission" : "Issued"} : ${esc(fmtDate(doc.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10), dossier))}</div></div>
      </div>
      <div class="host-object">${fr ? "Objet : attestation d’hébergement" : "Subject: accommodation certificate"}</div>
      <div class="host-title">ATTESTATION D’HÉBERGEMENT</div>
      <div class="host-body">
        <p>${fr ? `Je soussigné(e) <strong>${esc(data.hostName || "Host name")}</strong>, demeurant au <strong>${esc(data.hostAddress || "Host address")}</strong>, atteste accueillir à mon domicile :` : `I, <strong>${esc(data.hostName || "Host name")}</strong>, residing at <strong>${esc(data.hostAddress || "Host address")}</strong>, confirm that the following person is accommodated at my home:`}</p>
        <div class="host-details">
          <div class="host-detail"><span>${fr ? "Personne hébergée" : "Accommodated person"}</span><strong>${esc(nameOr(person))}</strong></div>
          <div class="host-detail"><span>${fr ? "Adresse d’accueil" : "Accommodation address"}</span><strong>${esc(data.propertyAddress || data.hostAddress || "—")}</strong></div>
          <div class="host-detail"><span>${fr ? "À compter du" : "From"}</span><strong>${esc(fmtDate(data.startDate, dossier))}</strong></div>
          <div class="host-detail"><span>${fr ? "Jusqu’au" : "Until"}</span><strong>${esc(fmtDate(data.endDate, dossier))}</strong></div>
        </div>
        <p style="margin-top:16px">${fr ? "L’hébergement est gratuit et la personne hébergée dispose d’un accès libre au logement. Cette attestation est établie pour constituer un dossier de candidature locative." : "The accommodation is provided free of charge and the accommodated person has unrestricted access to the home. This statement is provided for a rental application."}</p>
      </div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:16px">
        <div class="doc-meta"><span>${fr ? "Type de logement" : "Property type"}</span><strong>${fr ? "Appartement" : "Apartment"}</strong></div>
        <div class="doc-meta"><span>${fr ? "Occupation" : "Occupancy"}</span><strong>${fr ? "Résidence principale" : "Main residence"}</strong></div>
        <div class="doc-meta"><span>${fr ? "Personnes hébergées" : "Accommodated persons"}</span><strong>1</strong></div>
      </div>
      <div class="doc-box" style="margin-top:11px"><div class="doc-box__title">${fr ? "Pièces jointes" : "Supporting items"}</div><p>${fr ? "Copie d’une pièce d’identité de l’hébergeant · Justificatif de domicile de l’hébergeant · Copie du bail ou titre de propriété, le cas échéant." : "Copy of the host’s identity document · Host’s proof of address · Copy of the lease or title deed, where applicable."}</p></div>
      <div class="host-declaration">${fr ? "Je certifie l’exactitude des renseignements portés sur la présente attestation et m’engage à prévenir la personne hébergée de tout changement de situation." : "I confirm that the information above is accurate and will notify the accommodated person of any change in circumstances."}</div>
      <div class="host-sign"><div class="host-sign__place">${fr ? "Fait le" : "Signed on"} ${esc(fmtDate(data.endDate || docDateForPeriod("accommodation_certificate"), dossier))}<br>${fr ? "À" : "At"} ${esc(safe(dossier.country, "—"))}</div><div class="host-sign__line">${fr ? "Signature de l’hébergeant" : "Host signature"}<strong>${esc(data.hostSignature || data.hostName || "Signature")}</strong></div></div>
      <div class="doc-legal">${fr ? "Attestation d’hébergement générée pour un dossier. À compléter et signer par l’hébergeant." : "Accommodation certificate generated for the dossier. To be completed and signed by the host."}</div>
    </div>`;
}

function renderProofOfAddress(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="utility-page">
      <div class="utility-head">
        <div class="utility-brand"><div class="utility-brand__icon">${esc((data.providerName || "E").charAt(0))}</div><div><strong>${esc(data.providerName || "Provider name")}</strong><span>${esc(data.providerAddress || "Provider address")}<br>${esc(dossier.country)}</span></div></div>
        <div class="utility-bill-type"><span>${fr ? "Facture" : "Invoice"}</span><h1>${fr ? "ÉNERGIE" : "UTILITY BILL"}</h1><div class="doc-small doc-muted">${esc(data.service || "Household supply")}</div></div>
      </div>
      <div class="utility-address"><strong>${esc(nameOr(person))}</strong><br>${esc(personAddress(person))}</div>
      <div class="utility-account">
        <div><span>${fr ? "N° de compte" : "Account no."}</span><strong>${esc(data.accountNumber || "—")}</strong></div>
        <div><span>${fr ? "Facture du" : "Invoice date"}</span><strong>${esc(fmtDate(data.documentDate, dossier))}</strong></div>
        <div><span>${fr ? "Période" : "Period"}</span><strong>${esc(data.periodLabel || periodDisplay(doc.period, dossier))}</strong></div>
        <div><span>${fr ? "Échéance" : "Due date"}</span><strong>${esc(fmtDate(data.paymentDue, dossier))}</strong></div>
      </div>
      <div class="utility-summary"><div><span>${fr ? "Montant de la facture" : "Invoice amount"}</span><strong>${esc(money(dossier, data.amountDue))}</strong></div><div class="utility-summary__due"><span>${fr ? "À régler avant le" : "Pay before"}</span><strong>${esc(fmtDate(data.paymentDue, dossier))}</strong></div></div>
      <table class="doc-table utility-table">
        <thead><tr><th>${fr ? "Détail" : "Detail"}</th><th>${fr ? "Consommation" : "Usage"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead>
        <tbody>
          <tr><td>${fr ? "Abonnement" : "Standing charge"}</td><td>${esc(data.periodLabel || "—")}</td><td class="num">${esc(money(dossier, n(data.amountDue) * 0.31))}</td></tr>
          <tr><td>${fr ? "Consommation estimée" : "Estimated consumption"}</td><td>${fr ? "Selon relevé" : "Based on reading"}</td><td class="num">${esc(money(dossier, n(data.amountDue) * 0.56))}</td></tr>
          <tr><td>${fr ? "Taxes et contributions" : "Taxes and contributions"}</td><td>—</td><td class="num">${esc(money(dossier, n(data.amountDue) * 0.13))}</td></tr>
          <tr class="strong"><td colspan="2">${fr ? "Total" : "Total"}</td><td class="num">${esc(money(dossier, data.amountDue))}</td></tr>
        </tbody>
      </table>
      <div class="utility-pay">
        <div class="utility-pay__box"><span>${fr ? "Adresse de livraison" : "Supply address"}</span><strong>${esc(personAddress(person))}</strong><br>${fr ? "Le nom du titulaire figure sur cette facture." : "The account holder’s name appears on this invoice."}</div>
        <div class="utility-pay__box"><span>${fr ? "Paiement" : "Payment"}</span><strong>${fr ? "Prélèvement SEPA" : "Direct debit"}</strong><br>${esc(data.accountNumber || "")}</div>
      </div>
      <table class="doc-table doc-table--dense" style="margin-top:13px">
        <thead><tr><th>${fr ? "Historique de consommation" : "Usage history"}</th><th>${fr ? "Période" : "Period"}</th><th class="num">${fr ? "Montant facturé" : "Billed"}</th></tr></thead>
        <tbody><tr><td>${fr ? "Électricité" : "Electricity"}</td><td>${esc(data.periodLabel || "—")}</td><td class="num">${esc(money(dossier, n(data.amountDue) * 0.72))}</td></tr><tr><td>${fr ? "Gaz" : "Gas"}</td><td>${esc(data.periodLabel || "—")}</td><td class="num">${esc(money(dossier, n(data.amountDue) * 0.2))}</td></tr><tr><td>${fr ? "Services et taxes" : "Services and taxes"}</td><td>${esc(data.periodLabel || "—")}</td><td class="num">${esc(money(dossier, n(data.amountDue) * 0.08))}</td></tr></tbody>
      </table>
      <div class="doc-box" style="margin-top:11px"><div class="doc-box__title">${fr ? "Informations de paiement" : "Payment information"}</div><p>${fr ? `Facture à régler avant le ${esc(fmtDate(data.paymentDue, dossier))}. Le prélèvement est effectué sur le compte associé au contrat. Cette facture est destinée au dossier de candidature et ne remplace pas l’original du fournisseur.` : `Invoice due before ${esc(fmtDate(data.paymentDue, dossier))}. Payment is collected from the account linked to the contract. This invoice is intended for the application dossier and does not replace the provider’s original.`}</p></div>
      <div class="utility-footnote">${fr ? "Facture générée comme justificatif de domicile. Conservez la facture originale du fournisseur pour toute vérification." : "Invoice generated as proof of address. Keep the provider-issued original for verification."}</div>
      <div class="doc-legal">${fr ? "Document de démonstration généré par Doccccs. Il ne s’agit pas d’une facture émise par le fournisseur." : "Demo document generated by Doccccs. It is not an invoice issued by the provider."}</div>
    </div>`;
}

const statementRows = (doc, dossier, person, data) => {
  const fr = isFrance(dossier);
  const period = doc.period || new Date().toISOString().slice(0, 7);
  const salary = n(person?.netMonthly) || 2850;
  const variance = (hash(period) % 5) * 21;
  const day = (d) => `${period}-${String(d).padStart(2, "0")}`;
  const rows = [
    [day(2), fr ? "PRÉLÈVEMENT LOYER" : "RENT PAYMENT", "", n(dossier.context?.monthlyRent) || 1880],
    [day(4), fr ? "VIREMENT SALAIRE" : "SALARY TRANSFER", salary - variance, ""],
    [day(5), fr ? "CARTE — SUPERMARCHÉ" : "CARD — SUPERMARKET", "", 96.42],
    [day(6), fr ? "CARTE — TRANSPORT" : "CARD — TRANSPORT", "", 75],
    [day(8), fr ? "PRÉLÈVEMENT ÉNERGIE" : "ENERGY DIRECT DEBIT", "", 94.3],
    [day(10), fr ? "CARTE — CAFÉ" : "CARD — COFFEE SHOP", "", 18.6],
    [day(12), fr ? "CARTE — PHARMACIE" : "CARD — PHARMACY", "", 34.75],
    [day(14), fr ? "VIREMENT INTERNE ÉPARGNE" : "TRANSFER TO SAVINGS", "", 250],
    [day(16), fr ? "CARTE — RESTAURANT" : "CARD — RESTAURANT", "", 63.2],
    [day(18), fr ? "CARTE — ABONNEMENT" : "CARD — SUBSCRIPTION", "", 14.99],
    [day(21), fr ? "CARTE — SUPERMARCHÉ" : "CARD — SUPERMARKET", "", 72.11],
    [day(23), fr ? "VIREMENT REÇU" : "INCOMING TRANSFER", 180, ""],
    [day(25), fr ? "PRÉLÈVEMENT ASSURANCE" : "INSURANCE DIRECT DEBIT", "", 41.2],
    [day(27), fr ? "PAIEMENT CARTE" : "CARD PAYMENT", "", 128.4],
  ];
  return rows.map(([date, label, credit, debit]) => `<tr><td>${esc(fmtDate(date, dossier))}</td><td>${esc(label)}</td><td>${debit ? esc(money(dossier, debit)) : ""}</td><td>${credit ? esc(money(dossier, credit)) : ""}</td></tr>`).join("");
};

function renderBankStatement(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const period = doc.period || new Date().toISOString().slice(0, 7);
  const opening = n(data.openingBalance);
  const closing = n(data.closingBalance);
  return `
    <div class="bank-page">
      <div class="bank-head">
        <div class="bank-brand"><div class="bank-brand__mark">${esc((data.bankName || "B").charAt(0))}</div><div><strong>${esc(data.bankName || "Bank name")}</strong><span>${esc(data.bankAddress || "Bank address")}<br>${esc(dossier.country)} · Swift BHFRPFRP</span></div></div>
        <div class="bank-doc-type"><span>${fr ? "Relevé de compte" : "Account statement"}</span><h1>${fr ? "RELEVÉ DE COMPTE" : "ACCOUNT STATEMENT"}</h1><div class="doc-small doc-muted">${esc(periodDisplay(period, dossier))}</div></div>
      </div>
      <div class="bank-account-summary">
        <div class="bank-summary bank-summary--primary"><span>${fr ? "Solde au" : "Balance at"} ${esc(fmtDate(`${period}-01`, dossier))}</span><strong>${esc(money(dossier, opening))}</strong><small>${fr ? "Solde créditeur" : "Opening balance"}</small></div>
        <div class="bank-summary"><span>${fr ? "Solde au" : "Balance at"} ${esc(fmtDate(docDateForPeriod("bank_statement", period), dossier))}</span><strong>${esc(money(dossier, closing))}</strong><small>${fr ? "Solde de clôture" : "Closing balance"}</small></div>
        <div class="bank-summary"><span>${fr ? "Mouvements" : "Transactions"}</span><strong>14</strong><small>${fr ? "Débits et crédits" : "Debits and credits"}</small></div>
      </div>
      <div class="bank-account-line">
        <div><span>${fr ? "Titulaire" : "Account holder"}</span><strong>${esc(nameOr(person))}</strong></div>
        <div><span>${fr ? "Type de compte" : "Account type"}</span><strong>${esc(data.accountType || "Current account")}</strong></div>
        <div><span>IBAN</span><strong>${esc(data.iban || "—")}</strong></div>
      </div>
      <table class="doc-table bank-table doc-table--dense">
        <thead><tr><th>${fr ? "Date" : "Date"}</th><th>${fr ? "Libellé" : "Description"}</th><th>${fr ? "Débit" : "Debit"}</th><th>${fr ? "Crédit" : "Credit"}</th></tr></thead>
        <tbody>${statementRows(doc, dossier, person, data)}<tr class="closing"><td colspan="2">${fr ? "SOLDE DE CLÔTURE" : "CLOSING BALANCE"}</td><td colspan="2" class="doc-right">${esc(money(dossier, closing))}</td></tr></tbody>
      </table>
      <div class="bank-footer-note"><div>${fr ? "Relevé établi à partir de l’IBAN indiqué. Les opérations présentées sont représentatives du compte." : "Statement based on the supplied IBAN. Transactions are representative of the account."}<br>${fr ? "Référence" : "Reference"} : ${esc(data.statementReference || docId(doc))}</div><div class="bank-signature">${fr ? "Banque Horizon — service client" : "Customer service signature"}<strong>Banque Horizon</strong></div></div>
      <div class="doc-legal">${fr ? "Relevé généré pour un dossier. Vérifiez les opérations et soldes auprès de la banque." : "Generated statement for dossier use. Verify transactions and balances with the bank."}</div>
    </div>`;
}

function renderEmploymentContract(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="letter-page">
      <div class="letter-head">
        <div><div class="doc-kicker">${fr ? "Ressources humaines" : "Human resources"}</div><div class="doc-company-name" style="margin-top:4px">${esc(data.employerName || "Employer name")}</div><div class="doc-small doc-muted">${esc(data.employerAddress || "Employer address")}</div></div>
        <div class="letter-head__right"><strong>${fr ? "CONTRAT DE TRAVAIL" : "EMPLOYMENT CONTRACT"}</strong><br>${esc(data.contractType || "Permanent")}<br>${fr ? "Réf." : "Ref."} ${esc(docId(doc))}</div>
      </div>
      <div class="letter-date">${fr ? "Fait à" : "Issued at"} ${esc(dossier.context?.propertyAddress ? dossier.country : dossier.country)}, ${fr ? "le" : "on"} ${esc(fmtDate(data.issueDate, dossier))}</div>
      <h1 class="doc-title" style="font-size:27px;margin-top:13px">${fr ? "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE" : "EMPLOYMENT AGREEMENT"}</h1>
      <div class="doc-small doc-muted">${fr ? "Version de synthèse destinée au dossier de candidature" : "Summary version for the application dossier"}</div>
      <div class="doc-box" style="margin-top:17px">
        <div class="doc-box__title">${fr ? "Entre les soussignés" : "Between"}</div>
        <p><strong>${esc(data.employerName || "Employer name")}</strong>, ${fr ? "dont le siège est situé" : "whose registered office is at"} ${esc(data.employerAddress || "—")}, ${fr ? "représenté par" : "represented by"} ${esc(data.signatoryName || "—")}, ${esc(data.signatoryRole || "")}, ${fr ? "ci-après « l’Employeur »" : "hereafter “the Employer”"} ;</p>
        <p style="margin-top:7px">${fr ? "et" : "and"} <strong>${esc(nameOr(person))}</strong>, ${fr ? "demeurant" : "residing at"} ${esc(personAddress(person))}, ${fr ? "ci-après « le Salarié »" : "hereafter “the Employee”"}.</p>
      </div>
      <div class="doc-small doc-muted" style="margin-top:12px">${fr ? "Il a été convenu ce qui suit :" : "The following has been agreed:"}</div>
      <div class="doc-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1px;margin-top:9px;border:1px solid #d2d7d4;background:#d2d7d4">
        <div class="doc-meta"><span>${fr ? "Fonction" : "Role"}</span><strong>${esc(data.jobTitle || "Job title")}</strong></div>
        <div class="doc-meta"><span>${fr ? "Type de contrat" : "Contract type"}</span><strong>${esc(data.contractType || "Permanent")}</strong></div>
        <div class="doc-meta"><span>${fr ? "Date d’entrée" : "Start date"}</span><strong>${esc(fmtDate(data.startDate, dossier))}</strong></div>
        <div class="doc-meta"><span>${fr ? "Durée du travail" : "Working time"}</span><strong>${esc(data.workHours || "35 h / week")}</strong></div>
        <div class="doc-meta"><span>${fr ? "Lieu d’exécution" : "Workplace"}</span><strong>${esc(data.workplace || "—")}</strong></div>
        <div class="doc-meta"><span>${fr ? "Rémunération brute" : "Gross salary"}</span><strong>${esc(money(dossier, data.grossMonthly))} / ${fr ? "mois" : "month"}</strong></div>
      </div>
      <div class="doc-legal" style="border:0;padding-top:11px;text-align:left;font-family:Georgia,serif;font-size:8.5px;color:#47534d">
        <p><strong>1. ${fr ? "Engagement et fonctions" : "Appointment and duties"}</strong><br>${fr ? "Le Salarié est engagé en qualité de" : "The Employee is engaged as"} ${esc(data.jobTitle || "—")}. ${fr ? "Il exerce ses fonctions sous l’autorité de l’Employeur et se conforme aux règles internes applicables." : "They perform their duties under the authority of the Employer and comply with applicable internal rules."}</p>
        <p style="margin-top:7px"><strong>2. ${fr ? "Rémunération" : "Remuneration"}</strong><br>${fr ? "La rémunération mensuelle brute de base est fixée à" : "The gross monthly salary is"} ${esc(money(dossier, data.grossMonthly))}, ${fr ? "versée mensuellement par virement." : "paid monthly by transfer."}</p>
        <p style="margin-top:7px"><strong>3. ${fr ? "Durée et période d’essai" : "Term and probation"}</strong><br>${fr ? "Le contrat prend effet à la date d’entrée indiquée. La période d’essai et les conditions de rupture sont conformes aux dispositions applicables et aux règles internes de l’Employeur." : "The contract starts on the stated date. Probation and termination follow applicable law and the Employer’s internal rules."}</p>
        <p style="margin-top:7px"><strong>4. ${fr ? "Protection des données" : "Data protection"}</strong><br>${fr ? "Les données personnelles du Salarié sont traitées pour la gestion de la relation de travail, conformément aux règles applicables." : "Personal data is processed for workforce administration in accordance with applicable rules."}</p>
      </div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:12px">
        <div class="doc-meta"><span>${fr ? "Durée hebdomadaire" : "Weekly hours"}</span><strong>${esc(data.workHours || "35 h")}</strong></div>
        <div class="doc-meta"><span>${fr ? "Congés annuels" : "Annual leave"}</span><strong>${fr ? "5 semaines" : "5 weeks"}</strong></div>
        <div class="doc-meta"><span>${fr ? "Prévoyance" : "Benefits"}</span><strong>${fr ? "Mutuelle entreprise" : "Company health cover"}</strong></div>
      </div>
      <div class="doc-box" style="margin-top:10px"><div class="doc-box__title">${fr ? "Avantages et organisation du travail" : "Benefits and working arrangements"}</div><p>${fr ? "Le Salarié bénéficie des dispositifs collectifs applicables au sein de l’entreprise, notamment la couverture santé et prévoyance, l’épargne salariale le cas échéant, et les règles de télétravail en vigueur. Les modalités détaillées figurent dans les documents internes remis à l’entrée en fonction." : "The Employee receives the collective arrangements applicable within the organisation, including health and insurance cover, profit-sharing where applicable, and current remote-working rules. Detailed arrangements are set out in the internal documents provided at onboarding."}</p></div>
      ${signatureBlock(fr ? "L’Employeur" : "For the Employer", fr ? "Le Salarié" : "Employee", data.signatoryName || "Employer signatory", person?.fullName || "Employee", dossier, data.issueDate)}
      <div class="doc-tiny doc-muted" style="margin-top:8px">${fr ? "Document de synthèse généré par Doccccs. Le contrat original signé par les parties prévaut." : "Summary document generated by Doccccs. The signed original contract prevails."}</div>
    </div>`;
}

function renderEmploymentLetter(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="letter-page">
      <div class="letter-head">
        <div><div class="doc-company-name" style="font-size:16px">${esc(data.employerName || "Employer name")}</div><div class="doc-small doc-muted">${esc(data.employerAddress || "Employer address")}<br>${fr ? "Ressources humaines" : "Human resources"}</div></div>
        <div class="letter-head__right"><strong>${fr ? "ATTESTATION EMPLOYEUR" : "EMPLOYER LETTER"}</strong><br>${fr ? "Réf." : "Ref."} ${esc(docId(doc))}</div>
      </div>
      <div class="letter-date">${fr ? "Le" : "Date"} ${esc(fmtDate(data.issueDate, dossier))}</div>
      <div class="letter-object">${fr ? "Objet : attestation d’emploi et de rémunération" : "Subject: employment and income confirmation"}</div>
      <div class="letter-body">
        <p>${fr ? "À qui de droit," : "To whom it may concern,"}</p>
        <p>${fr ? `Nous attestons que <strong>${esc(nameOr(person))}</strong> est employé(e) au sein de notre entreprise depuis le <strong>${esc(fmtDate(data.startDate, dossier))}</strong> en qualité de <strong>${esc(data.jobTitle || "—")}</strong>.` : `We confirm that <strong>${esc(nameOr(person))}</strong> has been employed by our organisation since <strong>${esc(fmtDate(data.startDate, dossier))}</strong> in the role of <strong>${esc(data.jobTitle || "—")}</strong>.`}</p>
        <p>${fr ? `Son contrat est de type <strong>${esc(data.contractType || "—")}</strong>. Sa rémunération brute mensuelle de référence s’élève à <strong>${esc(money(dossier, data.grossMonthly))}</strong>.` : `The contract type is <strong>${esc(data.contractType || "—")}</strong>. The reference gross monthly salary is <strong>${esc(money(dossier, data.grossMonthly))}</strong>.`}</p>
        <p>${fr ? "Cette attestation est délivrée à l’intéressé(e) pour servir et valoir ce que de droit dans le cadre de sa candidature." : "This letter is issued for the employee’s application file and for any lawful purpose."}</p>
      </div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:16px">
        <div class="doc-meta"><span>${fr ? "Statut" : "Employment status"}</span><strong>${fr ? "Emploi actif" : "Active"}</strong></div>
        <div class="doc-meta"><span>${fr ? "Date d’entrée" : "Start date"}</span><strong>${esc(fmtDate(data.startDate, dossier))}</strong></div>
        <div class="doc-meta"><span>${fr ? "Contact vérification" : "Verification contact"}</span><strong>${esc(data.signatoryName || "HR")}</strong></div>
      </div>
      <div class="doc-box" style="margin-top:12px"><div class="doc-box__title">${fr ? "Renseignements complémentaires" : "Additional confirmation"}</div><p>${fr ? `Le contrat est en cours à la date de la présente attestation, sans préavis de rupture connu à ce jour. La rémunération annuelle brute de référence s’élève à ${esc(money(dossier, n(data.grossMonthly) * 12))}. Pour toute vérification, l’employeur peut être contacté à l’adresse indiquée en en-tête.` : `The contract remains active at the date of this letter, with no notice of termination known at this time. The reference annual gross salary is ${esc(money(dossier, n(data.grossMonthly) * 12))}. For verification, the employer may be contacted at the address in the letterhead.`}</p></div>
      <div class="letter-sign"><div class="letter-sign__box">${fr ? "Pour l’Employeur" : "For the Employer"}<strong>${esc(data.signatoryName || "Name")}</strong>${esc(data.signatoryRole || "Role")}</div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Document généré pour le dossier. L’employeur doit confirmer les informations et signer l’attestation." : "Document generated for the dossier. The employer should confirm the information and sign the letter."}</div><div class="doc-stamp"><span>${fr ? "RESSOURCES HUMAINES" : "HUMAN RESOURCES"}<br>${esc((data.employerName || "").toUpperCase())}</span></div></div>
      <div class="doc-legal">${fr ? "Attestation employeur — maquette Doccccs." : "Employer letter — Doccccs draft."}</div>
    </div>`;
}

function renderSavingsStatement(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="savings-page">
      ${docTopline(fr ? "ATTESTATION DE SOLDE" : "BALANCE CERTIFICATE", fr ? "Épargne et fonds disponibles" : "Savings and available funds", data.bankName || "Bank name", data.bankAddress || "Bank address", docId(doc), data.documentDate, dossier)}
      <div class="savings-title">${fr ? "Attestation de solde" : "Balance certificate"}</div>
      <div class="savings-subtitle">${fr ? "À l’attention de" : "For the attention of"} ${esc(nameOr(person))}</div>
      <div class="savings-body">${fr ? `La banque soussignée atteste que le compte désigné ci-dessous, ouvert au nom de <strong>${esc(nameOr(person))}</strong>, présente le solde créditeur suivant à la date indiquée.` : `The undersigned bank certifies that the account named below, held by <strong>${esc(nameOr(person))}</strong>, has the following credit balance on the stated date.`}</div>
      <div class="savings-balance"><div><span>${fr ? "Solde certifié" : "Certified balance"}</span><strong>${esc(money(dossier, data.balance))}</strong></div><div class="doc-small doc-muted">${fr ? "Date du certificat" : "Certificate date"}<br><strong>${esc(fmtDate(data.documentDate, dossier))}</strong></div></div>
      <div class="savings-details">
        <div><span>${fr ? "Titulaire" : "Account holder"}</span><strong>${esc(nameOr(person))}</strong></div>
        <div><span>${fr ? "Type de compte" : "Account type"}</span><strong>${esc(data.accountType || "Savings account")}</strong></div>
        <div><span>IBAN</span><strong class="doc-mono">${esc(data.iban || "—")}</strong></div>
        <div><span>${fr ? "Banque" : "Bank"}</span><strong>${esc(data.bankName || "—")}</strong></div>
      </div>
      <table class="doc-table doc-table--dense" style="margin-top:15px">
        <thead><tr><th>${fr ? "Composition du solde" : "Balance composition"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead>
        <tbody><tr><td>${fr ? "Épargne disponible" : "Available savings"}</td><td class="num">${esc(money(dossier, data.balance))}</td></tr><tr><td>${fr ? "Sommes réservées" : "Reserved amounts"}</td><td class="num">${esc(money(dossier, 0))}</td></tr><tr class="strong"><td>${fr ? "Total certifié" : "Certified total"}</td><td class="num">${esc(money(dossier, data.balance))}</td></tr></tbody>
      </table>
      <div class="doc-meta-grid" style="margin-top:13px"><div class="doc-meta"><span>${fr ? "Dernier mouvement" : "Last movement"}</span><strong>${esc(fmtDate(data.documentDate, dossier))}</strong></div><div class="doc-meta"><span>${fr ? "Devise du compte" : "Account currency"}</span><strong>${esc(dossier.currency)}</strong></div></div>
      <div class="savings-certify">${fr ? "Ce solde est disponible et peut être pris en compte dans l’analyse des fonds propres ou de l’apport du dossier. Aucun nantissement ou blocage autre que ceux indiqués par le titulaire n’est mentionné." : "This balance is available and may be considered in the assessment of the applicant’s savings or deposit. No pledge or hold is noted other than those disclosed by the account holder."}</div>
      <div class="savings-sign"><div class="doc-small doc-muted">${fr ? "Fait à" : "Issued at"} ${esc(dossier.country)}, ${fr ? "le" : "on"} ${esc(fmtDate(data.documentDate, dossier))}</div><div class="savings-sign__line">${fr ? "Pour la banque" : "For the bank"}<strong>${esc(data.signatoryName || "Bank advisor")}</strong>${esc(data.signatoryRole || "")}</div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Attestation générée pour le dossier. Vérifiez le solde auprès de la banque avant dépôt." : "Certificate generated for the dossier. Verify the balance with the bank before submission."}</div><div class="doc-stamp"><span>${esc(data.bankName || "BANK")}<br>${fr ? "SERVICE CLIENTS" : "CLIENT SERVICES"}</span></div></div>
      <div class="doc-legal">${fr ? "Attestation de solde — maquette Doccccs." : "Balance certificate — Doccccs draft."}</div>
    </div>`;
}

function renderLoanSchedule(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const start = n(data.remainingBalance) || n(data.loanAmount);
  const rate = n(data.rate) / 100 / 12;
  const payment = n(data.monthlyPayment);
  let balance = start;
  const rows = [];
  const startDate = data.documentDate || new Date().toISOString().slice(0, 10);
  for (let i = 1; i <= 10; i += 1) {
    const date = new Date(`${startDate}T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + i);
    const interest = balance * rate;
    const principal = Math.max(0, payment - interest);
    balance = Math.max(0, balance - principal);
    rows.push(`<tr><td>${i}</td><td>${esc(fmtDate(date.toISOString().slice(0, 10), dossier))}</td><td class="num">${esc(money(dossier, payment))}</td><td class="num">${esc(money(dossier, interest))}</td><td class="num">${esc(money(dossier, principal))}</td><td class="num">${esc(money(dossier, balance))}</td></tr>`);
  }
  return `
    <div class="loan-page">
      ${docTopline(fr ? "TABLEAU D’AMORTISSEMENT" : "LOAN REPAYMENT SCHEDULE", fr ? "Prêt existant" : "Existing borrowing", data.lenderName || "Lender", "", data.loanReference || docId(doc), data.documentDate, dossier)}
      <div class="loan-summary"><div><span>${fr ? "Montant initial" : "Original amount"}</span><strong>${esc(money(dossier, data.loanAmount))}</strong></div><div><span>${fr ? "Mensualité" : "Monthly payment"}</span><strong>${esc(money(dossier, payment))}</strong></div><div><span>${fr ? "Taux" : "Rate"}</span><strong>${esc(data.rate || "—")}%</strong></div><div><span>${fr ? "Capital restant" : "Outstanding"}</span><strong>${esc(money(dossier, start))}</strong></div></div>
      <div class="doc-spacer-12"></div>
      <div class="doc-box"><div class="doc-box__title">${fr ? "Emprunteur" : "Borrower"}</div><p><strong>${esc(nameOr(person))}</strong> · ${fr ? "Durée initiale" : "Original term"} ${esc(data.termMonths || "—")} ${fr ? "mois" : "months"}</p></div>
      <table class="doc-table loan-table doc-table--dense">
        <thead><tr><th>${fr ? "N°" : "No."}</th><th>${fr ? "Échéance" : "Due date"}</th><th>${fr ? "Mensualité" : "Payment"}</th><th>${fr ? "Intérêts" : "Interest"}</th><th>${fr ? "Capital" : "Principal"}</th><th>${fr ? "Solde" : "Balance"}</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
      <div class="loan-note">${fr ? "Tableau indicatif reconstitué à partir du capital restant, du taux et de la mensualité saisis. Le tableau de la banque prévaut." : "Indicative schedule reconstructed from the supplied outstanding balance, rate and monthly payment. The lender’s schedule prevails."}</div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Document généré pour le dossier de financement." : "Document generated for the financing file."}</div><div class="doc-code">${qrSvg(doc.id + "loan")}</div></div>
      <div class="doc-legal">${fr ? "Échéancier de prêt — maquette Doccccs." : "Loan schedule — Doccccs draft."}</div>
    </div>`;
}

function renderBusinessRegistration(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="business-page">
      <div class="business-head">
        <div><div class="business-head__registry"><div class="business-head__seal">${fr ? "RCS" : "REG"}</div><div><div class="doc-kicker">${fr ? "Extrait d’immatriculation" : "Business register extract"}</div><div class="doc-small doc-muted">${esc(dossier.country)}</div></div></div><h1>${fr ? "EXTRAIT D’IMMATRICULATION" : "CERTIFICATE OF REGISTRATION"}</h1></div>
        <div class="business-head__right"><strong>${esc(data.registrationNumber || "—")}</strong><br>${fr ? "Extrait" : "Extract"} ${esc(docId(doc))}<br>${fr ? "Émis le" : "Issued"} ${esc(fmtDate(data.registrationDate || docDateForPeriod("business_registration"), dossier))}</div>
      </div>
      <div class="business-section"><div class="business-section__title">${fr ? "Identification de la personne morale" : "Legal entity identity"}</div><div class="business-grid"><div class="business-field business-field--full"><span>${fr ? "Dénomination" : "Company name"}</span><strong>${esc(data.companyName || "Company name")}</strong></div><div class="business-field"><span>${fr ? "Forme juridique" : "Legal form"}</span><strong>${esc(data.legalForm || "—")}</strong></div><div class="business-field"><span>${fr ? "Capital social" : "Share capital"}</span><strong>${esc(data.shareCapital || "—")}</strong></div><div class="business-field"><span>${fr ? "Numéro d’immatriculation" : "Registration no."}</span><strong>${esc(data.registrationNumber || "—")}</strong></div><div class="business-field"><span>${fr ? "Date d’immatriculation" : "Registration date"}</span><strong>${esc(fmtDate(data.registrationDate, dossier))}</strong></div><div class="business-field business-field--full"><span>${fr ? "Siège social" : "Registered office"}</span><strong>${esc(data.registeredAddress || "—")}</strong></div><div class="business-field business-field--full"><span>${fr ? "Activité déclarée" : "Registered activity"}</span><strong>${esc(data.activity || "—")}</strong></div></div></div>
      <div class="business-section"><div class="business-section__title">${fr ? " Représentation" : "Representation"}</div><div class="business-grid"><div class="business-field"><span>${fr ? "Représentant légal" : "Legal representative"}</span><strong>${esc(data.representative || nameOr(person))}</strong></div><div class="business-field"><span>${fr ? "Fonction" : "Role"}</span><strong>${fr ? "Président" : "Director"}</strong></div></div></div>
      <div class="business-section"><div class="business-section__title">${fr ? "Renseignements complémentaires" : "Additional information"}</div><div class="business-grid"><div class="business-field"><span>${fr ? "Observation" : "Note"}</span><strong>${fr ? "Immatriculation active" : "Active registration"}</strong></div><div class="business-field"><span>${fr ? "Registre" : "Register"}</span><strong>${fr ? "Registre du commerce" : "Business register"}</strong></div></div></div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:12px">
        <div class="doc-meta"><span>${fr ? "Établissements" : "Establishments"}</span><strong>1</strong></div>
        <div class="doc-meta"><span>${fr ? "Salariés" : "Employees"}</span><strong>${fr ? "1 à 4" : "1–4"}</strong></div>
        <div class="doc-meta"><span>${fr ? "TVA intracom." : "VAT number"}</span><strong>FR 42 ${esc((data.registrationNumber || "000000000").replaceAll(" ", ""))}</strong></div>
      </div>
      <div class="doc-box" style="margin-top:12px"><div class="doc-box__title">${fr ? "Mentions au registre" : "Register entries"}</div><p>${fr ? `L’immatriculation ne fait l’objet d’aucune mention de radiation à la date du présent extrait. Le siège et l’établissement principal sont enregistrés à l’adresse indiquée. Dernière mise à jour du registre : ${esc(fmtDate(data.registrationDate, dossier))}.` : `No strike-off entry is recorded at the date of this extract. The registered office and principal establishment are recorded at the stated address. Last register update: ${esc(fmtDate(data.registrationDate, dossier))}.`}</p></div>
      <div class="business-notice">${fr ? "Extrait généré à partir des informations saisies. Les mentions du registre officiel prévalent sur cette maquette." : "Extract generated from the values entered. The official register entry prevails over this draft."}</div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Référence de vérification" : "Verification reference"} : ${esc(docId(doc))}</div><div class="doc-code">${qrSvg(doc.id + "business")}</div></div>
      <div class="doc-legal">${fr ? "Extrait d’immatriculation — maquette Doccccs." : "Business registration extract — Doccccs draft."}</div>
    </div>`;
}

function renderTurnoverDeclaration(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const turnover = n(data.turnover);
  const contributions = n(data.contributions);
  const previous = n(data.previousBalance);
  const total = contributions + previous;
  return `
    <div class="urssaf-page">
      <div class="urssaf-head">
        <div class="urssaf-head__top"><div><div class="doc-kicker">${fr ? "Déclaration sociale" : "Social contribution declaration"}</div><h1>${fr ? "DÉCLARATION DE CHIFFRE D’AFFAIRES" : "TURNOVER DECLARATION"}</h1><div class="doc-small doc-muted">${esc(data.companyName || "Business name")}</div></div><div class="urssaf-head__right"><strong>${esc(data.registrationNumber || "—")}</strong><br>${fr ? "Référence" : "Reference"} ${esc(docId(doc))}<br>${fr ? "Date" : "Date"} ${esc(fmtDate(data.declarationDate, dossier))}</div></div>
      </div>
      <div class="urssaf-period"><span>${fr ? "Période déclarée" : "Declared period"}</span><strong>${esc(periodDisplay(doc.period, dossier))}</strong><span>${esc(data.declarationType || "Monthly")}</span></div>
      <div class="urssaf-form">
        <div class="urssaf-form__row urssaf-form__head"><div>${fr ? "Élément déclaré" : "Declared item"}</div><div>${fr ? "Base" : "Base"}</div><div>${fr ? "Montant" : "Amount"}</div></div>
        <div class="urssaf-form__row"><div>${fr ? "Chiffre d’affaires brut" : "Gross turnover"}</div><div class="num">${esc(money(dossier, turnover))}</div><div class="num">${esc(money(dossier, turnover))}</div></div>
        <div class="urssaf-form__row"><div>${fr ? "Cotisations sociales calculées" : "Calculated social contributions"}</div><div class="num">${esc(data.declarationType === "Quarterly" ? "Quarterly" : "Monthly")}</div><div class="num">${esc(money(dossier, contributions))}</div></div>
        <div class="urssaf-form__row"><div>${fr ? "Solde antérieur" : "Previous balance"}</div><div class="num">—</div><div class="num">${esc(money(dossier, previous))}</div></div>
        <div class="urssaf-form__row"><div>${fr ? "Net à payer" : "Net payable"}</div><div class="num">—</div><div class="num">${esc(money(dossier, total))}</div></div>
      </div>
      <div class="urssaf-total"><span>${fr ? "Total des cotisations dues" : "Total contributions due"}</span><strong>${esc(money(dossier, total))}</strong></div>
      <table class="doc-table doc-table--dense" style="margin-top:14px">
        <thead><tr><th>${fr ? "Déclarations récentes" : "Recent declarations"}</th><th>${fr ? "Période" : "Period"}</th><th class="num">${fr ? "Chiffre d’affaires" : "Turnover"}</th><th class="num">${fr ? "Cotisations" : "Contributions"}</th></tr></thead>
        <tbody><tr><td>${fr ? "Déclaration précédente" : "Previous declaration"}</td><td>${esc(data.declarationType === "Quarterly" ? "Q-1" : "M-1")}</td><td class="num">${esc(money(dossier, turnover * 0.94))}</td><td class="num">${esc(money(dossier, contributions * 0.94))}</td></tr><tr><td>${fr ? "Déclaration antérieure" : "Earlier declaration"}</td><td>${esc(data.declarationType === "Quarterly" ? "Q-2" : "M-2")}</td><td class="num">${esc(money(dossier, turnover * 0.88))}</td><td class="num">${esc(money(dossier, contributions * 0.88))}</td></tr><tr><td>${fr ? "Déclaration antérieure" : "Earlier declaration"}</td><td>${esc(data.declarationType === "Quarterly" ? "Q-3" : "M-3")}</td><td class="num">${esc(money(dossier, turnover * 0.91))}</td><td class="num">${esc(money(dossier, contributions * 0.91))}</td></tr></tbody>
      </table>
      <div class="doc-meta-grid" style="margin-top:12px"><div class="doc-meta"><span>${fr ? "Échéance de paiement" : "Payment deadline"}</span><strong>${fr ? "Fin du mois suivant" : "End of following month"}</strong></div><div class="doc-meta"><span>${fr ? "Mode de paiement" : "Payment method"}</span><strong>${fr ? "Prélèvement automatique" : "Direct debit"}</strong></div></div>
      <div class="urssaf-note">${fr ? "Déclaration établie à partir des montants saisis. Les taux et échéances applicables dépendent du statut et de la période. Conservez l’accusé de réception original délivré par l’organisme." : "Declaration based on the amounts entered. Applicable rates and deadlines depend on status and period. Keep the original receipt issued by the authority."}</div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:18px"><div class="doc-meta"><span>${fr ? "Déclarant" : "Declarant"}</span><strong>${esc(nameOr(person))}</strong></div><div class="doc-meta"><span>${fr ? "Établissement" : "Business"}</span><strong>${esc(data.companyName || "—")}</strong></div><div class="doc-meta"><span>${fr ? "Statut" : "Status"}</span><strong>${fr ? "Travailleur indépendant" : "Self-employed"}</strong></div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Document de synthèse pour le dossier." : "Summary document for the dossier."}</div><div class="doc-code">${qrSvg(doc.id + "urssaf")}</div></div>
      <div class="doc-legal">${fr ? "Déclaration de chiffre d’affaires — maquette Doccccs." : "Turnover declaration — Doccccs draft."}</div>
    </div>`;
}

function renderAnnualAccounts(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const revenue = n(data.revenue);
  const netIncome = n(data.netIncome);
  const assets = n(data.totalAssets);
  const equity = n(data.equity);
  return `
    <div class="accounts-page">
      <div class="accounts-head">
        <div><div class="doc-kicker">${fr ? "Comptes annuels" : "Annual accounts"}</div><h1>${fr ? "BILAN ET COMPTE DE RÉSULTAT" : "BALANCE SHEET AND INCOME STATEMENT"}</h1><div class="doc-small doc-muted">${esc(data.companyName || "Business name")} · ${esc(data.registrationNumber || "")}</div></div>
        <div class="accounts-head__right"><strong>${fr ? "Exercice" : "Financial year"} ${esc(doc.period || "")}</strong><br>${fr ? "Document" : "Document"} ${esc(docId(doc))}<br>${esc(fmtDate(data.documentDate, dossier))}</div>
      </div>
      <div class="accounts-summary"><div><span>${fr ? "Chiffre d’affaires" : "Revenue"}</span><strong>${esc(money(dossier, revenue))}</strong></div><div><span>${fr ? "Résultat net" : "Net income"}</span><strong>${esc(money(dossier, netIncome))}</strong></div><div><span>${fr ? "Total bilan" : "Total assets"}</span><strong>${esc(money(dossier, assets))}</strong></div><div><span>${fr ? "Capitaux propres" : "Equity"}</span><strong>${esc(money(dossier, equity))}</strong></div></div>
      <div class="accounts-columns">
        <div><div class="business-section__title">${fr ? "Bilan — actif" : "Balance sheet — assets"}</div><table class="doc-table accounts-table"><thead><tr><th>${fr ? "Poste" : "Item"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead><tbody><tr><td>${fr ? "Immobilisations" : "Fixed assets"}</td><td class="num">${esc(money(dossier, assets * 0.38))}</td></tr><tr><td>${fr ? "Créances" : "Receivables"}</td><td class="num">${esc(money(dossier, assets * 0.22))}</td></tr><tr><td>${fr ? "Trésorerie" : "Cash"}</td><td class="num">${esc(money(dossier, assets * 0.31))}</td></tr><tr><td>${fr ? "Autres actifs" : "Other assets"}</td><td class="num">${esc(money(dossier, assets * 0.09))}</td></tr></tbody></table><div class="accounts-total"><span>${fr ? "Total actif" : "Total assets"}</span><span>${esc(money(dossier, assets))}</span></div></div>
        <div><div class="business-section__title">${fr ? "Bilan — passif" : "Balance sheet — liabilities"}</div><table class="doc-table accounts-table"><thead><tr><th>${fr ? "Poste" : "Item"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead><tbody><tr><td>${fr ? "Capitaux propres" : "Equity"}</td><td class="num">${esc(money(dossier, equity))}</td></tr><tr><td>${fr ? "Dettes financières" : "Financial debt"}</td><td class="num">${esc(money(dossier, (assets - equity) * 0.3))}</td></tr><tr><td>${fr ? "Dettes fournisseurs" : "Trade payables"}</td><td class="num">${esc(money(dossier, (assets - equity) * 0.55))}</td></tr><tr><td>${fr ? "Autres passifs" : "Other liabilities"}</td><td class="num">${esc(money(dossier, (assets - equity) * 0.15))}</td></tr></tbody></table><div class="accounts-total"><span>${fr ? "Total passif" : "Total liabilities"}</span><span>${esc(money(dossier, assets))}</span></div></div>
      </div>
      <div class="business-section" style="margin-top:16px"><div class="business-section__title">${fr ? "Compte de résultat — synthèse" : "Income statement — summary"}</div><table class="doc-table accounts-table"><thead><tr><th>${fr ? "Poste" : "Item"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead><tbody><tr><td>${fr ? "Chiffre d’affaires" : "Revenue"}</td><td class="num">${esc(money(dossier, revenue))}</td></tr><tr><td>${fr ? "Charges d’exploitation" : "Operating expenses"}</td><td class="num">${esc(money(dossier, revenue * 0.72))}</td></tr><tr><td>${fr ? "Résultat d’exploitation" : "Operating result"}</td><td class="num">${esc(money(dossier, revenue * 0.28))}</td></tr><tr class="strong"><td>${fr ? "Résultat net" : "Net income"}</td><td class="num">${esc(money(dossier, netIncome))}</td></tr></tbody></table></div>
      <div class="accounts-note">${fr ? "Comptes simplifiés reconstitués à partir des valeurs saisies. Les comptes annuels validés par le comptable ou l’organisme compétent prévalent." : "Simplified accounts assembled from the values entered. Accounts validated by the accountant or competent authority prevail."}</div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Signataire" : "Signatory"} : ${esc(data.accountantName || "—")}</div><div class="doc-stamp"><span>${fr ? "COMPTES ANNUELS" : "ANNUAL ACCOUNTS"}<br>${esc((data.companyName || "").toUpperCase())}</span></div></div>
      <div class="doc-legal">${fr ? "Comptes annuels — maquette Doccccs." : "Annual accounts — Doccccs draft."}</div>
    </div>`;
}

function renderMaritalStatus(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const isPartnership = String(data.status || "").includes("PACS") || String(data.status || "").toLowerCase().includes("partnership");
  const isMarried = String(data.status || "").toLowerCase().includes("married") || String(data.status || "").includes("Marié");
  const title = fr ? (isPartnership ? "ATTESTATION DE PACS" : isMarried ? "EXTRAIT D’ACTE DE MARIAGE" : "ATTESTATION DE SITUATION FAMILIALE") : "CIVIL STATUS CERTIFICATE";
  return `
    <div class="marital-page">
      <div class="marital-head"><div><div class="doc-kicker">${fr ? "État civil" : "Civil status"}</div><h1>${title}</h1><div class="doc-small doc-muted">${esc(dossier.country)} · ${fr ? "Document de synthèse" : "Summary document"}</div></div><div class="marital-head__right"><strong>${esc(data.certificateNumber || "—")}</strong><br>${fr ? "Délivré le" : "Issued"} ${esc(fmtDate(data.issueDate, dossier))}<br>${fr ? "Registre" : "Register"} ${esc(data.registryOffice || "—")}</div></div>
      <div class="marital-intro">${fr ? `Le registre d’état civil atteste la situation suivante pour <strong>${esc(nameOr(person))}</strong>, né(e) le <strong>${esc(fmtDate(person?.birthDate))}</strong> à <strong>${esc(person?.birthPlace || "—")}</strong>.` : `The civil register records the following status for <strong>${esc(nameOr(person))}</strong>, born <strong>${esc(fmtDate(person?.birthDate, dossier))}</strong> at <strong>${esc(person?.birthPlace || "—")}</strong>.`}</div>
      <div class="marital-grid"><div class="marital-field"><span>${fr ? "Situation" : "Status"}</span><strong>${esc(data.status || "—")}</strong></div><div class="marital-field"><span>${fr ? "Conjoint / partenaire" : "Spouse / partner"}</span><strong>${esc(data.spouseName || "—")}</strong></div><div class="marital-field"><span>${fr ? "Date de l’acte" : "Certificate date"}</span><strong>${esc(fmtDate(data.issueDate, dossier))}</strong></div><div class="marital-field"><span>${fr ? "Autorité" : "Authority"}</span><strong>${esc(data.registryOffice || "—")}</strong></div><div class="marital-field marital-field--full"><span>${fr ? "Mention" : "Record"}</span><strong>${fr ? "Situation enregistrée dans les registres de l’état civil. Cette synthèse est destinée au dossier." : "Status recorded in the civil register. This summary is intended for the dossier."}</strong></div></div>
      <div class="doc-box" style="margin-top:14px"><div class="doc-box__title">${fr ? "Mentions complémentaires" : "Additional record"}</div><p>${fr ? "L’acte ou l’attestation ne comporte pas de mention contraire à la situation indiquée. Les informations personnelles figurant sur le document sont utilisées uniquement pour la constitution du dossier de candidature." : "The instrument contains no entry contradicting the status shown. Personal information on the document is used solely to assemble the application file."}</p></div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:12px"><div class="doc-meta"><span>${fr ? "Registre" : "Register"}</span><strong>${esc(data.registryOffice || "—")}</strong></div><div class="doc-meta"><span>${fr ? "Référence" : "Reference"}</span><strong>${esc(data.certificateNumber || "—")}</strong></div><div class="doc-meta"><span>${fr ? "Copie" : "Copy"}</span><strong>${fr ? "Extrait de synthèse" : "Summary extract"}</strong></div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Extrait de synthèse. L’acte original délivré par l’autorité compétente prévaut." : "Summary extract. The original issued by the competent authority prevails."}</div><div class="doc-code">${qrSvg(doc.id + "civil")}</div></div>
      <div class="marital-sign"><div class="doc-small doc-muted">${fr ? "Fait à" : "Issued at"} ${esc(dossier.country)}<br>${fr ? "Le" : "On"} ${esc(fmtDate(data.issueDate, dossier))}</div><div class="marital-sign__line">${fr ? "Registre d’état civil" : "Civil registrar"}<strong>${esc(data.signatoryName || "Registrar")}</strong></div></div>
      <div class="doc-legal">${fr ? "Justificatif de situation familiale — maquette Doccccs." : "Civil status evidence — Doccccs draft."}</div>
    </div>`;
}

function renderPurchaseAgreement(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const price = n(data.price);
  const deposit = n(data.deposit);
  return `
    <div class="agreement-page">
      <div class="agreement-head"><div><div class="doc-kicker">${fr ? "Vente immobilière" : "Property purchase"}</div><h1>${fr ? "COMPROMIS DE VENTE" : "PRELIMINARY SALE AGREEMENT"}</h1><div class="doc-small doc-muted">${fr ? "Version de synthèse" : "Summary version"}</div></div><div class="agreement-head__right"><strong>${esc(data.agreementReference || docId(doc))}</strong><br>${fr ? "Signé le" : "Signed"} ${esc(fmtDate(data.signingDate, dossier))}<br>${fr ? "Notaire" : "Notary"} ${esc(data.notaryName || "—")}</div></div>
      <div class="agreement-intro">${fr ? "Le présent document résume les conditions principales du compromis de vente signé entre les parties. Il est destiné à l’analyse du dossier de financement." : "This document summarises the principal terms of the preliminary sale agreement signed by the parties. It is intended for financing review."}</div>
      <div class="agreement-parties"><div class="agreement-party"><span>${fr ? "Vendeur" : "Vendor"}</span><strong>${esc(data.vendorName || "—")}</strong><p>${fr ? "Propriétaire du bien désigné ci-dessous." : "Owner of the property described below."}</p></div><div class="agreement-party"><span>${fr ? "Acquéreur(s)" : "Purchaser(s)"}</span><strong>${esc(data.buyerNames || nameOr(person))}</strong><p>${fr ? "Parties acheteuses du dossier." : "Applicant parties."}</p></div></div>
      <div class="agreement-property"><span>${fr ? "Bien" : "Property"}</span><strong>${esc(data.propertyAddress || dossier.context?.propertyAddress || "—")}</strong></div>
      <div class="agreement-terms"><div class="agreement-term"><div class="term-no">01</div><div>${fr ? "Prix de vente" : "Purchase price"}</div><div class="term-value">${esc(money(dossier, price))}</div></div><div class="agreement-term"><div class="term-no">02</div><div>${fr ? "Dépôt / séquestre" : "Deposit / escrow"}</div><div class="term-value">${esc(money(dossier, deposit))}</div></div><div class="agreement-term"><div class="term-no">03</div><div>${fr ? "Date cible de réitération" : "Target completion"}</div><div class="term-value">${esc(fmtDate(data.completionDate, dossier))}</div></div><div class="agreement-term"><div class="term-no">04</div><div>${fr ? "Conditions suspensives" : "Conditions precedent"}</div><div class="term-value">${fr ? "Prêt / diagnostics" : "Financing / surveys"}</div></div><div class="agreement-term"><div class="term-no">05</div><div>${fr ? "Honoraires de négociation" : "Agency fees"}</div><div class="term-value">${fr ? "À la charge de l’acquéreur" : "Payable by purchaser"}</div></div><div class="agreement-term"><div class="term-no">06</div><div>${fr ? "Diagnostics" : "Surveys"}</div><div class="term-value">${fr ? "Dossier joint" : "Attached pack"}</div></div><div class="agreement-term"><div class="term-no">07</div><div>${fr ? "Occupation" : "Occupancy"}</div><div class="term-value">${fr ? "Libre à la vente" : "Vacant on completion"}</div></div><div class="agreement-term"><div class="term-no">08</div><div>${fr ? "Acte authentique" : "Completion deed"}</div><div class="term-value">${esc(data.notaryName || "—")}</div></div></div>
      <div class="agreement-conditions">${fr ? "La vente est soumise aux conditions suspensives du compromis, notamment l’obtention d’un financement et la réalisation des diagnostics requis. Le présent résumé ne remplace pas l’acte signé." : "The sale is subject to the conditions in the agreement, including financing and required surveys. This summary does not replace the signed instrument."}</div>
      <div class="doc-box" style="margin-top:13px"><div class="doc-box__title">${fr ? "Financement et calendrier" : "Financing and timeline"}</div><p>${fr ? `L’acquéreur déclare financer l’opération au moyen d’un prêt immobilier. La demande de financement est jointe au dossier. La signature de l’acte authentique est envisagée au ${esc(fmtDate(data.completionDate, dossier))}, sous réserve de la levée des conditions suspensives.` : `The purchaser intends to finance the transaction with a mortgage. The financing application is attached to the file. Completion is targeted for ${esc(fmtDate(data.completionDate, dossier))}, subject to satisfaction of the conditions precedent.`}</p></div>
      <div class="agreement-signatures"><div class="agreement-signature">${fr ? "Vendeur" : "Vendor"}<strong>${esc(data.vendorName || "—")}</strong></div><div class="agreement-signature">${fr ? "Acquéreur" : "Purchaser"}<strong>${esc(nameOr(person))}</strong></div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Copie de synthèse pour le dossier bancaire." : "Summary copy for the lending file."}</div><div class="doc-stamp"><span>${fr ? "COMPROMIS" : "SALE AGREEMENT"}<br>${esc(data.agreementReference || "")}</span></div></div>
      <div class="doc-legal">${fr ? "Compromis de vente — maquette Doccccs." : "Preliminary sale agreement — Doccccs draft."}</div>
    </div>`;
}

function renderRenovationQuote(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const items = String(data.lineItems || "")
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts[0] && parts.some(Boolean));
  const parsed = items.map(([label, quantity = "1", unitPrice = "0"]) => ({
    label,
    quantity: n(quantity) || 1,
    unitPrice: n(unitPrice),
    total: (n(quantity) || 1) * n(unitPrice),
  }));
  const subtotal = parsed.reduce((sum, item) => sum + item.total, 0);
  const vat = subtotal * (n(data.vatRate) / 100);
  const total = subtotal + vat;
  return `
    <div class="quote-page">
      <div class="quote-head"><div><div class="quote-party"><span>${fr ? "Entreprise" : "Contractor"}</span><strong>${esc(data.contractorName || "Contractor")}</strong><p>${esc(data.contractorAddress || "Contractor address")}</p></div></div><div class="quote-head__right"><strong>${fr ? "DEVIS" : "QUOTATION"}</strong><br>${esc(data.quoteNumber || docId(doc))}<br>${fr ? "Date" : "Date"} ${esc(fmtDate(data.issueDate, dossier))}<br>${fr ? "Valable jusqu’au" : "Valid until"} ${esc(fmtDate(data.validUntil, dossier))}</div></div>
      <div class="quote-parties"><div class="quote-party"><span>${fr ? "Client" : "Client"}</span><strong>${esc(nameOr(person))}</strong><p>${esc(personAddress(person))}</p></div><div class="quote-party"><span>${fr ? "Bien concerné" : "Property"}</span><strong>${esc(data.propertyAddress || dossier.context?.propertyAddress || "—")}</strong><p>${fr ? "Travaux de rénovation" : "Renovation works"}</p></div></div>
      <div class="quote-intro">${fr ? "Le présent devis détaille les travaux prévus. Les montants sont exprimés hors taxes, avec la TVA applicable indiquée ci-dessous." : "This quotation details the planned works. Amounts are shown before tax, with applicable VAT shown below."}</div>
      <table class="doc-table quote-table doc-table--dense"><thead><tr><th>${fr ? "Désignation des travaux" : "Work item"}</th><th>${fr ? "Qté" : "Qty"}</th><th>${fr ? "Prix unitaire" : "Unit price"}</th><th>${fr ? "Total HT" : "Total"}</th></tr></thead><tbody>${parsed.map((item) => `<tr><td>${esc(item.label)}</td><td>${item.quantity}</td><td>${esc(money(dossier, item.unitPrice))}</td><td>${esc(money(dossier, item.total))}</td></tr>`).join("")}</tbody></table>
      <div class="quote-totals"><div class="quote-total"><span>${fr ? "Total HT" : "Subtotal"}</span><strong>${esc(money(dossier, subtotal))}</strong></div><div class="quote-total"><span>TVA ${esc(data.vatRate || "0")}%</span><strong>${esc(money(dossier, vat))}</strong></div><div class="quote-total quote-total--grand"><span>${fr ? "TOTAL TTC" : "TOTAL"}</span><strong>${esc(money(dossier, total))}</strong></div></div>
      <table class="doc-table doc-table--dense" style="margin-top:14px">
        <thead><tr><th>${fr ? "Échéancier proposé" : "Proposed schedule"}</th><th>${fr ? "Déclencheur" : "Milestone"}</th><th class="num">${fr ? "Montant" : "Amount"}</th></tr></thead>
        <tbody><tr><td>${fr ? "Acompte à la commande" : "Deposit on order"}</td><td>${fr ? "Signature du devis" : "Quote acceptance"}</td><td class="num">${esc(money(dossier, total * 0.3))}</td></tr><tr><td>${fr ? "Situation intermédiaire" : "Interim payment"}</td><td>${fr ? "Démarrage des travaux" : "Works started"}</td><td class="num">${esc(money(dossier, total * 0.4))}</td></tr><tr><td>${fr ? "Solde" : "Balance"}</td><td>${fr ? "Réception" : "Completion"}</td><td class="num">${esc(money(dossier, total * 0.3))}</td></tr></tbody>
      </table>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:12px"><div class="doc-meta"><span>${fr ? "Délai estimé" : "Estimated duration"}</span><strong>${fr ? "6 semaines" : "6 weeks"}</strong></div><div class="doc-meta"><span>${fr ? "Garantie" : "Warranty"}</span><strong>${fr ? "Décennale" : "10-year cover"}</strong></div><div class="doc-meta"><span>${fr ? "Assurance" : "Insurance"}</span><strong>${fr ? "RC professionnelle" : "Professional liability"}</strong></div></div>
      <div class="quote-conditions">${fr ? "Devis valable selon les conditions et la durée indiquées. Les travaux supplémentaires feront l’objet d’un avenant. Ce devis ne constitue pas une facture." : "Quotation valid under the stated terms and period. Additional work requires a variation. This quotation is not an invoice."}</div>
      <div class="quote-sign"><div class="doc-small doc-muted">${fr ? "Bon pour accord du client" : "Client acceptance"}<br><br>____________________________________</div><div class="quote-sign__line">${fr ? "Signature de l’entreprise" : "Contractor signature"}<strong>${esc(data.contractorSignature || data.contractorName || "Signature")}</strong></div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Devis de travaux généré pour le dossier. Le devis original signé prévaut." : "Renovation quote generated for the dossier. The signed original prevails."}</div><div class="doc-code">${qrSvg(doc.id + "quote")}</div></div>
      <div class="doc-legal">${fr ? "Devis de travaux — maquette Doccccs." : "Renovation quote — Doccccs draft."}</div>
    </div>`;
}

function renderGuarantorLetter(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="guarantee-page">
      <div class="guarantee-head"><div><div class="doc-kicker">${fr ? "Garantie locative" : "Guarantee"}</div><h1>${fr ? "ENGAGEMENT DE CAUTION" : "GUARANTOR UNDERTAKING"}</h1><div class="doc-small doc-muted">${fr ? "Engagement personnel" : "Personal undertaking"}</div></div><div class="guarantee-head__right"><strong>${esc(docId(doc))}</strong><br>${fr ? "Établi le" : "Dated"} ${esc(fmtDate(data.issueDate, dossier))}<br>${esc(dossier.country)}</div></div>
      <div class="guarantee-body">${fr ? `Je soussigné(e) <strong>${esc(data.guarantorName || nameOr(person))}</strong>, demeurant <strong>${esc(data.guarantorAddress || personAddress(person))}</strong>, déclare me porter caution personnelle pour la candidature locative portant sur le bien situé <strong>${esc(data.propertyAddress || dossier.context?.propertyAddress || "—")}</strong>.` : `I, <strong>${esc(data.guarantorName || nameOr(person))}</strong>, residing at <strong>${esc(data.guarantorAddress || personAddress(person))}</strong>, undertake to act as guarantor for the rental application concerning <strong>${esc(data.propertyAddress || dossier.context?.propertyAddress || "—")}</strong>.`}</div>
      <div class="guarantee-grid"><div class="guarantee-field"><span>${fr ? "Garant" : "Guarantor"}</span><strong>${esc(data.guarantorName || nameOr(person))}</strong></div><div class="guarantee-field"><span>${fr ? "Lien avec le candidat" : "Relationship"}</span><strong>${esc(data.relationship || "—")}</strong></div><div class="guarantee-field"><span>${fr ? "Revenu annuel de référence" : "Reference annual income"}</span><strong>${esc(money(dossier, data.guarantorIncome, 0))}</strong></div><div class="guarantee-field"><span>${fr ? "Durée de l’engagement" : "Guarantee period"}</span><strong>${esc(data.guaranteeDuration || "—")}</strong></div><div class="guarantee-field"><span>${fr ? "Bien concerné" : "Property"}</span><strong>${esc(data.propertyAddress || "—")}</strong></div><div class="guarantee-field"><span>${fr ? "Date" : "Date"}</span><strong>${esc(fmtDate(data.issueDate, dossier))}</strong></div></div>
      <table class="doc-table doc-table--dense" style="margin-top:14px">
        <thead><tr><th>${fr ? "Situation financière du garant" : "Guarantor financial summary"}</th><th class="num">${fr ? "Mensuel" : "Monthly"}</th><th class="num">${fr ? "Annuel" : "Annual"}</th></tr></thead>
        <tbody><tr><td>${fr ? "Revenus nets" : "Net income"}</td><td class="num">${esc(money(dossier, n(data.guarantorIncome) / 12))}</td><td class="num">${esc(money(dossier, data.guarantorIncome))}</td></tr><tr><td>${fr ? "Charges de logement" : "Housing costs"}</td><td class="num">${esc(money(dossier, n(dossier.context?.monthlyRent) || 0))}</td><td class="num">${esc(money(dossier, (n(dossier.context?.monthlyRent) || 0) * 12))}</td></tr><tr><td>${fr ? "Autres engagements" : "Other commitments"}</td><td class="num">${esc(money(dossier, n(data.guarantorIncome) * 0.08 / 12))}</td><td class="num">${esc(money(dossier, n(data.guarantorIncome) * 0.08))}</td></tr><tr class="strong"><td>${fr ? "Capacité estimée" : "Estimated capacity"}</td><td class="num">${esc(money(dossier, n(data.guarantorIncome) / 12 - (n(dossier.context?.monthlyRent) || 0) - n(data.guarantorIncome) * 0.08 / 12))}</td><td class="num">—</td></tr></tbody>
      </table>
      <div class="doc-box" style="margin-top:11px"><div class="doc-box__title">${fr ? "Pièces jointes au cautionnement" : "Documents attached"}</div><p>${fr ? "Pièce d’identité · Justificatif de domicile · Justificatifs de revenus · Justificatif de charges · Le présent engagement signé." : "Identity document · Proof of address · Proof of income · Evidence of commitments · This signed undertaking."}</p></div>
      <div class="guarantee-box">${fr ? "Je m’engage à honorer les obligations locatives garanties dans la limite et la durée prévues par le contrat de cautionnement applicable. Le présent engagement est inclus dans le dossier pour examen par le bailleur." : "I undertake to meet the guaranteed tenancy obligations within the limits and period of the applicable guarantee. This undertaking is included for the landlord’s review."}</div>
      <div class="guarantee-sign"><div class="doc-small doc-muted">${fr ? "Fait à" : "Signed at"} ${esc(dossier.country)}<br>${fr ? "Le" : "On"} ${esc(fmtDate(data.issueDate, dossier))}</div><div class="guarantee-sign__line">${fr ? "Signature du garant" : "Guarantor signature"}<strong>${esc(data.signature || data.guarantorName || "Signature")}</strong></div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Engagement généré pour le dossier. Le garant doit vérifier et signer le document original." : "Undertaking generated for the dossier. The guarantor should verify and sign the original."}</div><div class="doc-stamp"><span>${fr ? "CAUTION" : "GUARANTEE"}<br>${esc((data.guarantorName || "").toUpperCase())}</span></div></div>
      <div class="doc-legal">${fr ? "Engagement de caution — maquette Doccccs." : "Guarantor undertaking — Doccccs draft."}</div>
    </div>`;
}

function renderReferenceLetter(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="letter-page">
      <div class="letter-head"><div><div class="doc-company-name" style="font-size:15px">${esc(data.companyName || "Organisation")}</div><div class="doc-small doc-muted">${esc(data.companyAddress || "Organisation address")}</div></div><div class="letter-head__right"><strong>${fr ? "LETTRE DE RÉFÉRENCE" : "REFERENCE LETTER"}</strong><br>${fr ? "Réf." : "Ref."} ${esc(docId(doc))}</div></div>
      <div class="letter-date">${fr ? "Le" : "Date"} ${esc(fmtDate(data.issueDate, dossier))}</div>
      <div class="letter-object">${fr ? "Objet : référence professionnelle / locative" : "Subject: reference"}</div>
      <div class="letter-body"><p>${fr ? "À qui de droit," : "To whom it may concern,"}</p><p>${fr ? `Je confirme connaître <strong>${esc(nameOr(person))}</strong> en qualité de <strong>${esc(data.relationship || "référent")}</strong> depuis le <strong>${esc(fmtDate(data.startDate, dossier))}</strong>.` : `I confirm that I know <strong>${esc(nameOr(person))}</strong> as their <strong>${esc(data.relationship || "reference")}</strong> since <strong>${esc(fmtDate(data.startDate, dossier))}</strong>.`}</p></div>
      <div class="reference-quote">“${esc(data.statement || "The applicant has maintained a reliable and organised relationship with our organisation.")}”</div>
      <div class="reference-table"><div class="reference-row"><div>${fr ? "Référent" : "Reference author"}</div><div>${esc(data.authorName || "—")}</div></div><div class="reference-row"><div>${fr ? "Fonction" : "Role"}</div><div>${esc(data.authorRole || "—")}</div></div><div class="reference-row"><div>${fr ? "Organisation" : "Organisation"}</div><div>${esc(data.companyName || "—")}</div></div><div class="reference-row"><div>${fr ? "Période" : "Period"}</div><div>${esc(fmtDate(data.startDate, dossier))} — ${esc(fmtDate(data.endDate, dossier))}</div></div><div class="reference-row"><div>${fr ? "Contact" : "Contact"}</div><div>${esc(data.companyAddress || "—")}</div></div></div>
      <div class="doc-box" style="margin-top:12px"><div class="doc-box__title">${fr ? "Points de référence" : "Reference summary"}</div><p>${fr ? "Paiements effectués à échéance · Logement maintenu en bon état · Relation de voisinage sans incident · Aucun impayé connu à la date de la présente lettre." : "Payments made on time · Property maintained in good condition · No neighbour disputes · No known arrears at the date of this letter."}</p></div>
      <div class="letter-sign"><div class="letter-sign__box">${fr ? "Signature" : "Signature"}<strong>${esc(data.signature || data.authorName || "Signature")}</strong>${esc(data.authorRole || "")}</div></div>
      <div class="doc-legal">${fr ? "Lettre de référence générée pour le dossier. Vérifiez les faits avec l’auteur avant dépôt." : "Reference letter generated for the dossier. Verify the facts with the author before submission."}</div>
    </div>`;
}

function renderIncomeSummary(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const salary = n(data.salaryIncome);
  const other = n(data.otherIncome);
  const income = salary + other;
  const commitments = n(data.housingCost) + n(data.loanPayments) + n(data.otherCommitments);
  const surplus = income - commitments;
  return `
    <div class="income-page">
      ${docTopline(fr ? "SYNTHÈSE DES REVENUS" : "INCOME SUMMARY", fr ? "Analyse de capacité" : "Affordability summary", "Doccccs dossier review", "", docId(doc), data.issueDate, dossier)}
      <div class="income-applicant"><div><strong>${esc(nameOr(person))}</strong><span>${esc(personRole(person, dossier))} · ${esc(personAddress(person))}</span></div><div class="income-applicant__period"><strong>${esc(data.summaryPeriod || "Monthly")}</strong><span>${fr ? "Période analysée" : "Reviewed period"}</span></div></div>
      <div class="income-section"><div class="income-section__title">${fr ? "Revenus mensuels" : "Monthly income"}</div><table class="doc-table"><tbody><tr><td>${fr ? "Revenu salarial net" : "Net salary"}</td><td class="num">${esc(money(dossier, salary))}</td></tr><tr><td>${fr ? "Autres revenus" : "Other income"}</td><td class="num">${esc(money(dossier, other))}</td></tr><tr class="strong"><td>${fr ? "Total des revenus" : "Total income"}</td><td class="num">${esc(money(dossier, income))}</td></tr></tbody></table><div class="income-bar"><i style="width:100%"></i></div></div>
      <div class="income-section"><div class="income-section__title">${fr ? "Charges mensuelles" : "Monthly commitments"}</div><table class="doc-table"><tbody><tr><td>${fr ? "Logement" : "Housing"}</td><td class="num">${esc(money(dossier, data.housingCost))}</td></tr><tr><td>${fr ? "Prêts existants" : "Existing loans"}</td><td class="num">${esc(money(dossier, data.loanPayments))}</td></tr><tr><td>${fr ? "Autres engagements" : "Other commitments"}</td><td class="num">${esc(money(dossier, data.otherCommitments))}</td></tr><tr class="strong"><td>${fr ? "Total des charges" : "Total commitments"}</td><td class="num">${esc(money(dossier, commitments))}</td></tr></tbody></table><div class="income-bar"><i style="width:${income ? Math.min(100, (commitments / income) * 100) : 0}%"></i></div></div>
      <div class="payslip-summary" style="margin-top:15px"><div class="payslip-summary__item"><span>${fr ? "Capacité résiduelle" : "Monthly surplus"}</span><strong>${esc(money(dossier, surplus))}</strong></div><div class="payslip-summary__item"><span>${fr ? "Épargne disponible" : "Savings available"}</span><strong>${esc(money(dossier, data.savings))}</strong></div><div class="payslip-summary__item payslip-summary__item--grand"><span>${fr ? "Taux d’endettement" : "Commitment ratio"}</span><strong>${income ? `${((commitments / income) * 100).toFixed(0)}%` : "—"}</strong></div></div>
      <table class="doc-table doc-table--dense" style="margin-top:14px">
        <thead><tr><th>${fr ? "Source de revenu / engagement" : "Income / commitment source"}</th><th>${fr ? "Nature" : "Type"}</th><th class="num">${fr ? "Montant mensuel" : "Monthly"}</th></tr></thead>
        <tbody><tr><td>${fr ? "Salaire net" : "Net salary"}</td><td>${fr ? "Déclaratif" : "Declared"}</td><td class="num">${esc(money(dossier, salary))}</td></tr><tr><td>${fr ? "Autres revenus" : "Other income"}</td><td>${fr ? "Déclaratif" : "Declared"}</td><td class="num">${esc(money(dossier, other))}</td></tr><tr><td>${fr ? "Logement" : "Housing"}</td><td>${fr ? "Charge" : "Commitment"}</td><td class="num">${esc(money(dossier, data.housingCost))}</td></tr><tr><td>${fr ? "Prêts" : "Loans"}</td><td>${fr ? "Charge" : "Commitment"}</td><td class="num">${esc(money(dossier, data.loanPayments))}</td></tr></tbody>
      </table>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:12px"><div class="doc-meta"><span>${fr ? "Banque" : "Bank"}</span><strong>${esc(person?.bankName || "—")}</strong></div><div class="doc-meta"><span>IBAN</span><strong>${esc(person?.iban || "—")}</strong></div><div class="doc-meta"><span>${fr ? "Période" : "Period"}</span><strong>${esc(data.summaryPeriod || "—")}</strong></div></div>
      <div class="income-note">${fr ? "Synthèse établie à partir des données du dossier. Elle ne remplace pas les justificatifs originaux et ne constitue pas une décision de prêt." : "Summary based on dossier data. It does not replace source documents and is not a lending decision."}</div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Préparé pour examen interne du dossier." : "Prepared for internal dossier review."}</div><div class="doc-code">${qrSvg(doc.id + "income")}</div></div>
      <div class="doc-legal">${fr ? "Synthèse des revenus — maquette Doccccs." : "Income summary — Doccccs draft."}</div>
    </div>`;
}

function renderApplicationLetter(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  return `
    <div class="letter-page">
      <div class="letter-head"><div><div class="doc-name" style="font-weight:700">${esc(nameOr(person))}</div><div class="doc-small doc-muted">${esc(personAddress(person))}<br>${esc(person?.email || "")} · ${esc(person?.phone || "")}</div></div><div class="letter-head__right"><strong>${fr ? "LETTRE DE CANDIDATURE" : "APPLICATION LETTER"}</strong><br>${esc(dossier.country)}<br>${esc(fmtDate(data.issueDate, dossier))}</div></div>
      <div class="letter-date">${fr ? "À l’attention de" : "To"} ${esc(data.recipientName || "—")}<br>${esc(data.recipientRole || "")}${data.recipientCompany ? ` · ${esc(data.recipientCompany)}` : ""}</div>
      <div class="letter-object">${fr ? "Objet : candidature pour" : "Subject: application for"} ${esc(data.propertyAddress || dossier.context?.propertyAddress || "the property")}</div>
      <div class="letter-body"><p>${fr ? "Madame, Monsieur," : "Dear Sir or Madam,"}</p><p>${esc(data.intro || "I am writing to present my application for the property.")}</p><p>${fr ? `Le loyer ou la mensualité envisagé(e) est de <strong>${esc(money(dossier, data.monthlyRent))}</strong>. Mon dossier comprend l’ensemble des pièces demandées, classées par personne et par justificatif.` : `The proposed rent or repayment is <strong>${esc(money(dossier, data.monthlyRent))}</strong>. My enclosed dossier contains the requested documents, organised by person and requirement.`}</p><p>${fr ? "Je reste à votre disposition pour toute précision ou pour organiser une visite." : "I remain available for any further information or to arrange a viewing."}</p><p>${fr ? "Cordialement," : "Yours faithfully,"}</p></div>
      <div class="reference-table" style="margin-top:16px"><div class="reference-row"><div>${fr ? "Pièces jointes" : "Enclosures"}</div><div>${fr ? "Dossier classé" : "Indexed dossier"}</div></div><div class="reference-row"><div>${fr ? "Identité" : "Identity"}</div><div>${fr ? "Incluse" : "Included"}</div></div><div class="reference-row"><div>${fr ? "Revenus" : "Income"}</div><div>${fr ? "Inclus" : "Included"}</div></div><div class="reference-row"><div>${fr ? "Garant" : "Guarantor"}</div><div>${dossier.persons.some((item) => item.role === "guarantor") ? (fr ? "Inclus" : "Included") : (fr ? "Non applicable" : "Not applicable")}</div></div></div>
      <div class="letter-sign"><div class="letter-sign__box">${fr ? "Signature" : "Signature"}<strong>${esc(data.signature || nameOr(person))}</strong></div></div>
      <div class="doc-legal">${fr ? "Lettre de candidature générée pour le dossier. Relisez et adaptez le texte avant envoi." : "Application letter generated for the dossier. Review and adapt the text before sending."}</div>
    </div>`;
}

function renderGeneric(doc, dossier, person, data) {
  const fr = isFrance(dossier);
  const body = String(data.body || "").split("\n").filter(Boolean).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
  return `
    <div class="letter-page">
      ${docTopline(data.title || "SUPPORTING DOCUMENT", data.subtitle || "Supporting evidence", data.issuerName || "Issuer", data.issuerAddress || "", data.reference || docId(doc), data.issueDate, dossier)}
      <div class="letter-object">${fr ? "Destinataire" : "Recipient"} : ${esc(nameOr(person))} · ${esc(personAddress(person))}</div>
      <h1 class="doc-title" style="font-size:26px;margin-top:17px">${esc(data.title || "Supporting document")}</h1>
      <div class="letter-body">${body || `<p>${esc(data.subtitle || "Supporting document")}</p>`}</div>
      <div class="doc-meta-grid doc-meta-grid--3" style="margin-top:16px"><div class="doc-meta"><span>${fr ? "Émetteur" : "Issuer"}</span><strong>${esc(data.issuerName || "—")}</strong></div><div class="doc-meta"><span>${fr ? "Référence" : "Reference"}</span><strong>${esc(data.reference || docId(doc))}</strong></div><div class="doc-meta"><span>${fr ? "Date" : "Date"}</span><strong>${esc(fmtDate(data.issueDate, dossier))}</strong></div></div>
      <div class="doc-box" style="margin-top:12px"><div class="doc-box__title">${fr ? "Vérification" : "Verification"}</div><p>${fr ? "Le présent document est inclus à titre de pièce justificative. L’émetteur doit confirmer les informations, la référence et la signature avant utilisation définitive." : "This document is included as supporting evidence. The issuer should confirm the information, reference and signature before final use."}</p></div>
      <div class="letter-sign"><div class="letter-sign__box">${fr ? "Signature de l’émetteur" : "Issuer signature"}<strong>${esc(data.signature || data.issuerName || "Signature")}</strong>${esc(data.issuerName || "")}</div></div>
      <div class="doc-issuer-row"><div class="doc-issuer-note">${fr ? "Document pays générique généré pour le dossier. Adaptez le contenu et faites confirmer les informations par l’émetteur." : "Country-specific supporting document generated for the dossier. Adapt the content and have the issuer confirm it."}</div><div class="doc-code">${qrSvg(doc.id + "generic")}</div></div>
      <div class="doc-legal">${fr ? "Document de soutien — maquette Doccccs." : "Supporting document — Doccccs draft."}</div>
    </div>`;
}

export function renderIndexDocument(dossier) {
  const docs = dossier.documents || [];
  const uploads = dossier.uploads || [];
  const completed = dossier.requirements.filter((requirement) => docs.some((doc) => doc.requirementId === requirement.id) || uploads.some((upload) => upload.requirementId === requirement.id)).length;
  const applicableGuarantor = dossier.persons.some((person) => person.role === "guarantor");
  const rows = dossier.requirements.map((requirement, index) => {
    const count = docs.filter((doc) => doc.requirementId === requirement.id).length + uploads.filter((upload) => upload.requirementId === requirement.id).length;
    const na = requirement.scope === "guarantor" && !applicableGuarantor;
    const status = na ? "n/a" : count ? "done" : "missing";
    return `<tr><td>${index + 1}</td><td>${esc(requirement.label)}</td><td>${esc(requirement.category)}</td><td>${esc(requirement.scope === "guarantor" ? "Guarantor" : requirement.scope === "household" ? "Household" : "Applicant")}</td><td class="${status === "done" ? "status-done" : status === "missing" ? "status-missing" : "doc-muted"}">${status === "done" ? "Documented" : status === "missing" ? "Missing" : "N/A"}</td></tr>`;
  }).join("");
  return `<div class="doc-page index-page" data-doc-template="index">
    <div class="index-brand"><div class="index-brand__logo"><span>D</span>doccccs</div><span>Dossier index · ${esc(dossier.country)}</span></div>
    <div class="index-title"><div class="index-title__kicker">${esc(dossier.type === "mortgage" ? "Mortgage application" : "Rental application")} · ${esc(dossier.country)}</div><h1>${esc(dossier.title)}</h1><p>Prepared ${esc(fmtDate(new Date().toISOString().slice(0, 10), dossier, true))} · Index of documents and source types</p></div>
    <div class="index-summary"><div><span>Checklist items</span><strong>${dossier.requirements.length}</strong></div><div><span>Documented</span><strong>${completed}</strong></div><div><span>Generated drafts</span><strong>${docs.length}</strong></div><div><span>Uploaded originals</span><strong>${uploads.length}</strong></div></div>
    <div class="index-people">${dossier.persons.map((person) => `<div class="index-person">${esc(nameOr(person))}<span>${esc(roleLabel(person.role, dossier.type))}</span></div>`).join("")}</div>
    <table class="doc-table index-table doc-table--dense"><thead><tr><th>#</th><th>Requirement</th><th>Category</th><th>Scope</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="index-note">Generated drafts are editable facsimiles prepared in Doccccs. Uploaded originals are preserved separately. Issuer-issued originals should be used wherever authenticity is required by a landlord, lender, authority or other third party.</div>
    <div class="index-footer"><span>Doccccs dossier index</span><span>${esc(dossier.country)} · ${esc(new Date().toISOString().slice(0, 10))}</span></div>
  </div>`;
}
