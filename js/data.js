export const APP_VERSION = 1;

export const uid = (prefix = "id") =>
  `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)}`;

export const COUNTRIES = [
  { code: "fr", name: "France", locale: "fr-FR", currency: "EUR", flag: "🇫🇷" },
  { code: "gb", name: "United Kingdom", locale: "en-GB", currency: "GBP", flag: "🇬🇧" },
  { code: "us", name: "United States", locale: "en-US", currency: "USD", flag: "🇺🇸" },
  { code: "de", name: "Germany", locale: "de-DE", currency: "EUR", flag: "🇩🇪" },
  { code: "es", name: "Spain", locale: "es-ES", currency: "EUR", flag: "🇪🇸" },
  { code: "it", name: "Italy", locale: "it-IT", currency: "EUR", flag: "🇮🇹" },
  { code: "nl", name: "Netherlands", locale: "nl-NL", currency: "EUR", flag: "🇳🇱" },
  { code: "pt", name: "Portugal", locale: "pt-PT", currency: "EUR", flag: "🇵🇹" },
  { code: "be", name: "Belgium", locale: "fr-BE", currency: "EUR", flag: "🇧🇪" },
  { code: "ca", name: "Canada", locale: "en-CA", currency: "CAD", flag: "🇨🇦" },
];

export const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map((country) => [country.code, country]));

export const CATEGORIES = [
  "Identity",
  "Address",
  "Employment",
  "Income",
  "Tax",
  "Banking",
  "Housing",
  "Self-employed",
  "Property",
  "Guarantor",
  "Other",
];

export const SCOPES = {
  applicant: { label: "Each applicant", short: "Per applicant" },
  guarantor: { label: "Each guarantor", short: "Per guarantor" },
  household: { label: "Household / shared", short: "Household" },
};

export const FREQUENCIES = {
  none: { label: "One document", short: "Single" },
  monthly: { label: "Monthly set", short: "Monthly" },
  annual: { label: "Annual set", short: "Annual" },
};

const field = (key, label, type = "text", opts = {}) => ({ key, label, type, ...opts });
const textarea = (key, label, opts = {}) => field(key, label, "textarea", { wide: true, ...opts });
const select = (key, label, options, opts = {}) => field(key, label, "select", { options, ...opts });
const month = (key, label, opts = {}) => field(key, label, "month", opts);
const date = (key, label, opts = {}) => field(key, label, "date", opts);
const number = (key, label, opts = {}) => field(key, label, "number", { step: "0.01", ...opts });

export const TEMPLATES = {
  id_card: {
    label: "ID card",
    short: "ID card",
    category: "Identity",
    description: "Two-sided national identity card layout.",
    icon: "id",
    series: "none",
    fields: [
      field("documentNumber", "Document number", "text", { group: "Document" }),
      date("issueDate", "Issue date", { group: "Document" }),
      date("expiryDate", "Valid until", { group: "Document" }),
      field("authority", "Issuing authority", "text", { group: "Document" }),
      field("portrait", "Portrait photo", "file", { group: "Portrait", hint: "Optional. A JPG or PNG portrait makes the facsimile more convincing." }),
    ],
  },
  passport: {
    label: "Passport",
    short: "Passport",
    category: "Identity",
    description: "Passport data page with a calculated MRZ.",
    icon: "passport",
    series: "none",
    fields: [
      field("documentNumber", "Passport number", "text", { group: "Document" }),
      date("issueDate", "Issue date", { group: "Document" }),
      date("expiryDate", "Date of expiry", { group: "Document" }),
      field("authority", "Issuing authority", "text", { group: "Document" }),
      field("mrzNumber", "MRZ document number", "text", { group: "Document", hint: "Leave blank to use the passport number." }),
      field("portrait", "Portrait photo", "file", { group: "Portrait", hint: "Optional JPG or PNG portrait." }),
    ],
  },
  employment_contract: {
    label: "Employment contract",
    short: "Contract",
    category: "Employment",
    description: "A clean contract summary with parties, role and pay.",
    icon: "contract",
    series: "none",
    fields: [
      field("employerName", "Employer", "text", { group: "Employer" }),
      field("employerAddress", "Employer address", "text", { group: "Employer", wide: true }),
      field("jobTitle", "Job title", "text", { group: "Role" }),
      select("contractType", "Contract type", ["Permanent", "Fixed term", "Freelance", "Internship"], { group: "Role" }),
      date("startDate", "Start date", { group: "Role" }),
      field("workHours", "Weekly hours", "text", { group: "Role" }),
      field("workplace", "Workplace", "text", { group: "Role" }),
      number("grossMonthly", "Gross monthly salary", { group: "Pay" }),
      field("signatoryName", "Signatory", "text", { group: "Signature" }),
      field("signatoryRole", "Signatory role", "text", { group: "Signature" }),
      date("issueDate", "Document date", { group: "Signature" }),
    ],
  },
  employment_letter: {
    label: "Employer letter",
    short: "Employer letter",
    category: "Employment",
    description: "Employer confirmation of role, status and income.",
    icon: "letter",
    series: "none",
    fields: [
      field("employerName", "Employer", "text", { group: "Employer" }),
      field("employerAddress", "Employer address", "text", { group: "Employer", wide: true }),
      field("jobTitle", "Job title", "text", { group: "Employment" }),
      select("contractType", "Contract type", ["Permanent", "Fixed term", "Freelance", "Internship"], { group: "Employment" }),
      date("startDate", "Start date", { group: "Employment" }),
      number("grossMonthly", "Gross monthly salary", { group: "Income" }),
      field("signatoryName", "Signatory", "text", { group: "Signature" }),
      field("signatoryRole", "Signatory role", "text", { group: "Signature" }),
      date("issueDate", "Letter date", { group: "Signature" }),
    ],
  },
  payslip: {
    label: "Payslip",
    short: "Payslip",
    category: "Income",
    description: "Monthly pay statement with contributions and net pay.",
    icon: "payslip",
    series: "monthly",
    fields: [
      field("employerName", "Employer", "text", { group: "Employer" }),
      field("employerAddress", "Employer address", "text", { group: "Employer", wide: true }),
      field("jobTitle", "Job title", "text", { group: "Employment" }),
      field("employeeNumber", "Employee number", "text", { group: "Employment" }),
      field("socialNumber", "Social security number", "text", { group: "Employment" }),
      number("grossMonthly", "Gross monthly pay", { group: "Pay" }),
      number("netMonthly", "Net monthly pay", { group: "Pay" }),
      number("bonus", "Bonus / variable pay", { group: "Pay" }),
      number("overtime", "Overtime", { group: "Pay" }),
      date("payDate", "Pay date", { group: "Pay" }),
      field("iban", "Payment IBAN", "text", { group: "Bank" }),
    ],
  },
  tax_notice: {
    label: "Tax notice",
    short: "Tax notice",
    category: "Tax",
    description: "Income tax assessment summary with fiscal reference.",
    icon: "receipt",
    series: "annual",
    fields: [
      field("fiscalYear", "Fiscal year", "text", { group: "Assessment" }),
      field("taxReference", "Tax reference", "text", { group: "Assessment" }),
      number("referenceIncome", "Reference income", { group: "Assessment" }),
      number("taxableIncome", "Taxable income", { group: "Assessment" }),
      number("taxDue", "Tax due", { group: "Assessment" }),
      field("parts", "Tax parts / filing status", "text", { group: "Assessment" }),
      field("taxOffice", "Tax office", "text", { group: "Assessment" }),
      date("issueDate", "Issue date", { group: "Assessment" }),
    ],
  },
  rent_receipt: {
    label: "Rent receipt",
    short: "Rent receipt",
    category: "Housing",
    description: "Monthly receipt for rent and charges.",
    icon: "home",
    series: "monthly",
    fields: [
      field("landlordName", "Landlord / agent", "text", { group: "Parties" }),
      field("landlordAddress", "Landlord address", "text", { group: "Parties", wide: true }),
      field("propertyAddress", "Rented property", "text", { group: "Property", wide: true }),
      number("monthlyRent", "Rent", { group: "Amounts" }),
      number("monthlyCharges", "Charges", { group: "Amounts" }),
      date("paymentDate", "Payment date", { group: "Amounts" }),
      field("paymentMethod", "Payment method", "text", { group: "Amounts" }),
      field("landlordSignature", "Landlord signature", "text", { group: "Signature" }),
    ],
  },
  accommodation_certificate: {
    label: "Accommodation certificate",
    short: "Accommodation certificate",
    category: "Housing",
    description: "Host statement confirming accommodation.",
    icon: "home",
    series: "none",
    fields: [
      field("hostName", "Host name", "text", { group: "Host" }),
      field("hostAddress", "Host address", "text", { group: "Host", wide: true }),
      field("hostPhone", "Host phone", "text", { group: "Host" }),
      field("propertyAddress", "Accommodation address", "text", { group: "Accommodation", wide: true }),
      date("startDate", "From", { group: "Accommodation" }),
      date("endDate", "Until", { group: "Accommodation" }),
      field("hostSignature", "Host signature", "text", { group: "Signature" }),
    ],
  },
  proof_of_address: {
    label: "Proof of address",
    short: "Proof of address",
    category: "Address",
    description: "Utility or telecom invoice used as address evidence.",
    icon: "bolt",
    series: "none",
    fields: [
      field("providerName", "Provider", "text", { group: "Provider" }),
      field("providerAddress", "Provider address", "text", { group: "Provider", wide: true }),
      field("service", "Service", "text", { group: "Invoice" }),
      field("accountNumber", "Account number", "text", { group: "Invoice" }),
      field("documentDate", "Invoice date", "date", { group: "Invoice" }),
      field("periodLabel", "Billing period", "text", { group: "Invoice" }),
      number("amountDue", "Amount due", { group: "Invoice" }),
      field("paymentDue", "Payment due", "date", { group: "Invoice" }),
    ],
  },
  bank_statement: {
    label: "Bank statement",
    short: "Bank statement",
    category: "Banking",
    description: "Monthly account statement with transaction detail.",
    icon: "bank",
    series: "monthly",
    fields: [
      field("bankName", "Bank", "text", { group: "Account" }),
      field("bankAddress", "Bank address", "text", { group: "Account", wide: true }),
      field("accountType", "Account type", "text", { group: "Account" }),
      field("iban", "IBAN", "text", { group: "Account" }),
      field("accountNumber", "Account number", "text", { group: "Account" }),
      number("openingBalance", "Opening balance", { group: "Balances" }),
      number("closingBalance", "Closing balance", { group: "Balances" }),
      field("statementReference", "Statement reference", "text", { group: "Balances" }),
    ],
  },
  savings_statement: {
    label: "Savings certificate",
    short: "Savings certificate",
    category: "Banking",
    description: "Bank balance certificate for savings or deposit funds.",
    icon: "bank",
    series: "none",
    fields: [
      field("bankName", "Bank", "text", { group: "Bank" }),
      field("bankAddress", "Bank address", "text", { group: "Bank", wide: true }),
      field("accountType", "Account type", "text", { group: "Account" }),
      field("iban", "IBAN", "text", { group: "Account" }),
      number("balance", "Certified balance", { group: "Account" }),
      date("documentDate", "Certificate date", { group: "Account" }),
      field("signatoryName", "Bank signatory", "text", { group: "Signature" }),
      field("signatoryRole", "Signatory role", "text", { group: "Signature" }),
    ],
  },
  loan_schedule: {
    label: "Loan schedule",
    short: "Loan schedule",
    category: "Banking",
    description: "Existing loan details and repayment table.",
    icon: "loan",
    series: "none",
    fields: [
      field("lenderName", "Lender", "text", { group: "Loan" }),
      field("loanReference", "Loan reference", "text", { group: "Loan" }),
      number("loanAmount", "Original loan amount", { group: "Loan" }),
      number("monthlyPayment", "Monthly payment", { group: "Loan" }),
      number("remainingBalance", "Outstanding balance", { group: "Loan" }),
      number("rate", "Interest rate (%)", { group: "Loan" }),
      field("termMonths", "Term (months)", "number", { group: "Loan" }),
      date("documentDate", "Schedule date", { group: "Loan" }),
    ],
  },
  business_registration: {
    label: "Business registration",
    short: "Registration",
    category: "Self-employed",
    description: "Company registration extract with legal identity.",
    icon: "building",
    series: "none",
    fields: [
      field("companyName", "Company name", "text", { group: "Company" }),
      field("registrationNumber", "Registration number", "text", { group: "Company" }),
      field("legalForm", "Legal form", "text", { group: "Company" }),
      field("shareCapital", "Share capital", "text", { group: "Company" }),
      field("registeredAddress", "Registered address", "text", { group: "Company", wide: true }),
      field("registrationDate", "Registration date", "date", { group: "Company" }),
      field("activity", "Registered activity", "text", { group: "Company", wide: true }),
      field("representative", "Legal representative", "text", { group: "Company" }),
    ],
  },
  urssaf_declaration: {
    label: "Turnover declaration",
    short: "Turnover declaration",
    category: "Self-employed",
    description: "Periodic turnover and contribution declaration.",
    icon: "calculator",
    series: "monthly",
    fields: [
      field("companyName", "Business name", "text", { group: "Business" }),
      field("registrationNumber", "Registration number", "text", { group: "Business" }),
      select("declarationType", "Declaration period", ["Monthly", "Quarterly"], { group: "Declaration" }),
      number("turnover", "Turnover", { group: "Declaration" }),
      number("contributions", "Contributions", { group: "Declaration" }),
      number("previousBalance", "Previous balance", { group: "Declaration" }),
      date("declarationDate", "Declaration date", { group: "Declaration" }),
    ],
  },
  annual_accounts: {
    label: "Annual accounts",
    short: "Annual accounts",
    category: "Self-employed",
    description: "Simplified balance sheet and profit and loss page.",
    icon: "chart",
    series: "annual",
    fields: [
      field("companyName", "Business name", "text", { group: "Business" }),
      field("registrationNumber", "Registration number", "text", { group: "Business" }),
      number("revenue", "Revenue", { group: "Year" }),
      number("netIncome", "Net income", { group: "Year" }),
      number("totalAssets", "Total assets", { group: "Year" }),
      number("equity", "Equity", { group: "Year" }),
      date("documentDate", "Document date", { group: "Year" }),
      field("accountantName", "Accountant / signatory", "text", { group: "Signature" }),
    ],
  },
  marital_status: {
    label: "Marital status",
    short: "Marital status",
    category: "Other",
    description: "Marriage, PACS or civil partnership status evidence.",
    icon: "rings",
    series: "none",
    fields: [
      select("status", "Status", ["Married", "Civil partnership / PACS", "Single", "Divorced", "Widowed"], { group: "Status" }),
      field("spouseName", "Spouse / partner", "text", { group: "Status" }),
      field("registryOffice", "Registry office", "text", { group: "Certificate" }),
      field("certificateNumber", "Certificate number", "text", { group: "Certificate" }),
      date("issueDate", "Issue date", { group: "Certificate" }),
      field("signatoryName", "Registrar / signatory", "text", { group: "Certificate" }),
    ],
  },
  purchase_agreement: {
    label: "Purchase agreement",
    short: "Purchase agreement",
    category: "Property",
    description: "Compromis / promesse de vente summary with key terms.",
    icon: "key",
    series: "none",
    fields: [
      field("propertyAddress", "Property", "text", { group: "Property", wide: true }),
      number("price", "Purchase price", { group: "Terms" }),
      number("deposit", "Deposit", { group: "Terms" }),
      field("vendorName", "Vendor", "text", { group: "Parties" }),
      field("buyerNames", "Buyer(s)", "text", { group: "Parties", wide: true }),
      field("notaryName", "Notary", "text", { group: "Parties" }),
      date("signingDate", "Signing date", { group: "Terms" }),
      field("completionDate", "Target completion", "date", { group: "Terms" }),
      field("agreementReference", "Agreement reference", "text", { group: "Terms" }),
    ],
  },
  renovation_quote: {
    label: "Renovation quote",
    short: "Renovation quote",
    category: "Property",
    description: "Itemised contractor quote for planned works.",
    icon: "hammer",
    series: "none",
    fields: [
      field("contractorName", "Contractor", "text", { group: "Contractor" }),
      field("contractorAddress", "Contractor address", "text", { group: "Contractor", wide: true }),
      field("propertyAddress", "Property", "text", { group: "Project", wide: true }),
      field("quoteNumber", "Quote number", "text", { group: "Project" }),
      date("issueDate", "Quote date", { group: "Project" }),
      date("validUntil", "Valid until", { group: "Project" }),
      textarea("lineItems", "Line items", { group: "Project", rows: 5, hint: "One item per line: description | quantity | unit price. VAT is applied at the rate below." }),
      number("vatRate", "VAT rate (%)", { group: "Project" }),
      field("contractorSignature", "Contractor signature", "text", { group: "Signature" }),
    ],
  },
  guarantor_letter: {
    label: "Guarantor undertaking",
    short: "Guarantor undertaking",
    category: "Guarantor",
    description: "Formal guarantor commitment with income and property.",
    icon: "shield",
    series: "none",
    fields: [
      field("guarantorName", "Guarantor name", "text", { group: "Guarantor" }),
      field("guarantorAddress", "Guarantor address", "text", { group: "Guarantor", wide: true }),
      field("relationship", "Relationship", "text", { group: "Guarantor" }),
      number("guarantorIncome", "Guarantor annual income", { group: "Guarantee" }),
      field("propertyAddress", "Property covered", "text", { group: "Guarantee", wide: true }),
      field("guaranteeDuration", "Guarantee duration", "text", { group: "Guarantee" }),
      date("issueDate", "Undertaking date", { group: "Guarantee" }),
      field("signature", "Signature", "text", { group: "Signature" }),
    ],
  },
  reference_letter: {
    label: "Reference letter",
    short: "Reference",
    category: "Other",
    description: "Landlord or employer reference with relationship history.",
    icon: "quote",
    series: "none",
    fields: [
      field("authorName", "Author", "text", { group: "Author" }),
      field("authorRole", "Author role", "text", { group: "Author" }),
      field("companyName", "Organisation", "text", { group: "Author" }),
      field("companyAddress", "Organisation address", "text", { group: "Author", wide: true }),
      field("relationship", "Relationship to applicant", "text", { group: "Reference" }),
      date("startDate", "Relationship from", { group: "Reference" }),
      date("endDate", "Relationship until", { group: "Reference" }),
      textarea("statement", "Reference text", { group: "Reference", rows: 5 }),
      date("issueDate", "Letter date", { group: "Signature" }),
      field("signature", "Signature", "text", { group: "Signature" }),
    ],
  },
  income_summary: {
    label: "Income summary",
    short: "Income summary",
    category: "Income",
    description: "Applicant income, commitments and net surplus table.",
    icon: "calculator",
    series: "none",
    fields: [
      number("salaryIncome", "Salary income (monthly)", { group: "Income" }),
      number("otherIncome", "Other income (monthly)", { group: "Income" }),
      number("housingCost", "Housing cost (monthly)", { group: "Commitments" }),
      number("loanPayments", "Loan payments (monthly)", { group: "Commitments" }),
      number("otherCommitments", "Other commitments (monthly)", { group: "Commitments" }),
      number("savings", "Savings available", { group: "Assets" }),
      field("summaryPeriod", "Summary period", "text", { group: "Summary" }),
      date("issueDate", "Summary date", { group: "Summary" }),
    ],
  },
  application_letter: {
    label: "Application letter",
    short: "Application letter",
    category: "Other",
    description: "Tailored cover letter for a rental or lending file.",
    icon: "pen",
    series: "none",
    fields: [
      field("recipientName", "Recipient", "text", { group: "Recipient" }),
      field("recipientRole", "Recipient role", "text", { group: "Recipient" }),
      field("recipientCompany", "Recipient organisation", "text", { group: "Recipient" }),
      field("propertyAddress", "Property", "text", { group: "Application", wide: true }),
      number("monthlyRent", "Monthly rent / repayment", { group: "Application" }),
      textarea("intro", "Letter text", { group: "Application", rows: 6 }),
      date("issueDate", "Letter date", { group: "Application" }),
      field("signature", "Signature", "text", { group: "Application" }),
    ],
  },
  generic: {
    label: "Generic document",
    short: "Document",
    category: "Other",
    description: "A flexible letterhead document for country-specific evidence.",
    icon: "file",
    series: "none",
    fields: [
      field("title", "Document title", "text", { group: "Content" }),
      field("subtitle", "Subtitle", "text", { group: "Content" }),
      textarea("body", "Body", { group: "Content", rows: 8 }),
      field("issuerName", "Issuer", "text", { group: "Issuer" }),
      field("issuerAddress", "Issuer address", "text", { group: "Issuer", wide: true }),
      field("reference", "Reference", "text", { group: "Issuer" }),
      date("issueDate", "Document date", { group: "Issuer" }),
      field("signature", "Signature", "text", { group: "Issuer" }),
    ],
  },
};

export const TEMPLATE_LIST = Object.entries(TEMPLATES).map(([id, template]) => ({ id, ...template }));

export function templateLabel(templateId, countryCode = "fr") {
  const fallback = TEMPLATES[templateId]?.label || "Document";
  if (countryCode !== "fr") return fallback;
  return {
    id_card: "Carte d’identité",
    passport: "Passeport",
    employment_contract: "Contrat de travail",
    employment_letter: "Attestation employeur",
    payslip: "Bulletin de paie",
    tax_notice: "Avis d’imposition",
    rent_receipt: "Quittance de loyer",
    accommodation_certificate: "Attestation d’hébergement",
    proof_of_address: "Justificatif de domicile",
    bank_statement: "Relevé de compte",
    savings_statement: "Attestation de solde",
    loan_schedule: "Tableau d’amortissement",
    business_registration: "Extrait d’immatriculation",
    urssaf_declaration: "Déclaration de chiffre d’affaires",
    annual_accounts: "Comptes annuels",
    marital_status: "Attestation de situation familiale",
    purchase_agreement: "Compromis de vente",
    renovation_quote: "Devis de travaux",
    guarantor_letter: "Engagement de caution",
    reference_letter: "Lettre de recommandation",
    income_summary: "Synthèse des revenus",
    application_letter: "Lettre de candidature",
    generic: "Document",
  }[templateId] || fallback;
}

const req = (label, category, templates, opts = {}) => ({
  id: uid("req"),
  key: opts.key || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  label,
  category,
  templates,
  description: opts.description || "",
  required: opts.required !== false,
  scope: opts.scope || "applicant",
  frequency: opts.frequency || "none",
  defaultCount: opts.defaultCount || 1,
  conditional: Boolean(opts.conditional),
});

const idReq = (scope = "applicant") => req("Valid ID or passport", "Identity", ["id_card", "passport"], {
  scope,
  description: "Government-issued photo identification. One of the two layouts is enough.",
});

const addressReq = (scope = "applicant") => req("Recent proof of address", "Address", ["proof_of_address"], {
  scope,
  description: "A recent utility, telecom or accommodation document showing the applicant’s address.",
});

const employmentReq = (scope = "applicant") => req("Employment contract or employer letter", "Employment", ["employment_contract", "employment_letter", "business_registration"], {
  scope,
  description: "Contract, employer attestation or business registration for a self-employed applicant.",
});

const payslipReq = (count = 3, scope = "applicant") => req(`Last ${count} payslips`, "Income", ["payslip"], {
  scope,
  frequency: "monthly",
  defaultCount: count,
  description: "Consecutive monthly pay statements.",
});

const bankReq = (count = 3, scope = "applicant", label = `Last ${count} months of bank statements`) => req(label, "Banking", ["bank_statement"], {
  scope,
  frequency: "monthly",
  defaultCount: count,
  description: "Personal account statements; add separate sets for joint accounts where relevant.",
});

const taxReq = (count = 1, scope = "applicant") => req(count > 1 ? `Last ${count} income tax notices` : "Latest income tax notice", "Tax", ["tax_notice"], {
  scope,
  frequency: "annual",
  defaultCount: count,
  description: "Official income tax assessment for the most recent assessment year(s).",
});

const savingsReq = (scope = "applicant") => req("Savings statements and proof of deposit", "Banking", ["savings_statement"], {
  scope,
  description: "Evidence of savings and funds available for the deposit.",
});

const loanReq = (scope = "applicant") => req("Loan agreements and repayment schedules", "Banking", ["loan_schedule"], {
  scope,
  required: false,
  description: "Existing borrowing, outstanding balances and monthly repayments.",
});

const otherIncomeReq = (scope = "applicant") => req("Other income and financial commitments", "Income", ["income_summary"], {
  scope,
  required: false,
  description: "Evidence of additional income or recurring commitments, where applicable.",
});

const maritalReq = (scope = "applicant") => req("Marital or civil partnership status", "Other", ["marital_status"], {
  scope,
  required: false,
  description: "Marriage, PACS or civil partnership evidence, where applicable.",
});

const purchaseReq = () => req("Preliminary purchase agreement", "Property", ["purchase_agreement"], {
  scope: "household",
  required: false,
  description: "Compromis or promesse de vente, if already signed.",
});

const renovationReq = () => req("Renovation quotes", "Property", ["renovation_quote"], {
  scope: "household",
  required: false,
  description: "Contractor quotes for planned renovation work.",
});

const rentalHistoryReq = (count = 3, frequency = "monthly") => req("Rent receipts or accommodation certificate", "Housing", ["rent_receipt", "accommodation_certificate"], {
  scope: "applicant",
  frequency,
  defaultCount: count,
  description: "Recent rent receipts. If staying with family or friends, use an accommodation certificate instead.",
});

const selfEmployedRegistrationReq = () => req("Proof of business registration", "Self-employed", ["business_registration"], {
  required: false,
  conditional: true,
  description: "Registration extract or equivalent proof of business status, if self-employed.",
});

const selfEmployedAccountsReq = (count = 3, frequency = "annual") => req("Turnover declarations or annual accounts", "Self-employed", ["urssaf_declaration", "annual_accounts"], {
  required: false,
  conditional: true,
  frequency,
  defaultCount: count,
  description: "Up to three years of turnover declarations or annual accounts, if self-employed.",
});

const selfEmployedBankReq = () => req("Business bank statements", "Self-employed", ["bank_statement"], {
  required: false,
  conditional: true,
  frequency: "monthly",
  defaultCount: 3,
  description: "Recent business account statements, if self-employed.",
});

const guarantorIdReq = () => req("Guarantor’s valid ID or passport", "Guarantor", ["id_card", "passport"], {
  scope: "guarantor",
  description: "Photo identification for each guarantor.",
});

const guarantorAddressReq = () => req("Guarantor’s proof of address", "Guarantor", ["proof_of_address"], {
  scope: "guarantor",
  description: "Recent evidence of the guarantor’s address.",
});

const guarantorEmploymentReq = () => req("Guarantor’s employment or business documents", "Guarantor", ["employment_contract", "employment_letter", "business_registration"], {
  scope: "guarantor",
  description: "Employment contract, employer letter or business registration.",
});

const guarantorIncomeReq = () => req("Guarantor’s proof of income", "Guarantor", ["payslip", "tax_notice", "savings_statement"], {
  scope: "guarantor",
  frequency: "monthly",
  defaultCount: 3,
  description: "Payslips, tax notice or other credible evidence of the guarantor’s income.",
});

const guarantorUndertakingReq = () => req("Signed guarantor undertaking", "Guarantor", ["guarantor_letter"], {
  scope: "guarantor",
  required: false,
  description: "Optional formal undertaking setting out the guarantor’s commitment.",
});

const optional = (requirement, description) => ({ ...requirement, required: false, description: description || requirement.description });

const genericRentalReqs = ({ payslipCount = 3, bankCount = 3, taxCount = 1, extras = [] } = {}) => [
  idReq(),
  addressReq(),
  employmentReq(),
  payslipReq(payslipCount),
  bankReq(bankCount),
  taxReq(taxCount),
  ...extras,
  rentalHistoryReq(3),
  guarantorIdReq(),
  guarantorAddressReq(),
  guarantorEmploymentReq(),
  guarantorIncomeReq(),
  guarantorUndertakingReq(),
];

const genericMortgageReqs = ({ payslipCount = 3, bankCount = 3, taxCount = 2 } = {}) => [
  idReq(),
  addressReq(),
  employmentReq(),
  payslipReq(payslipCount),
  taxReq(taxCount),
  bankReq(bankCount),
  req("Joint account bank statements", "Banking", ["bank_statement"], {
    scope: "household",
    frequency: "monthly",
    defaultCount: bankCount,
    required: false,
    description: "Statements for any joint account held by the applicants.",
  }),
  savingsReq(),
  loanReq(),
  otherIncomeReq(),
  maritalReq(),
  purchaseReq(),
  renovationReq(),
  selfEmployedRegistrationReq(),
  selfEmployedAccountsReq(3, "annual"),
  selfEmployedBankReq(),
  guarantorIdReq(),
  guarantorAddressReq(),
  guarantorEmploymentReq(),
  guarantorIncomeReq(),
  guarantorUndertakingReq(),
];

const franceRental = [
  idReq(),
  employmentReq(),
  payslipReq(3),
  taxReq(1),
  rentalHistoryReq(3),
  selfEmployedRegistrationReq(),
  selfEmployedAccountsReq(1, "annual"),
  guarantorIdReq(),
  guarantorAddressReq(),
  guarantorEmploymentReq(),
  guarantorIncomeReq(),
  guarantorUndertakingReq(),
];

const franceMortgage = [
  idReq(),
  addressReq(),
  employmentReq(),
  payslipReq(3),
  taxReq(2),
  bankReq(3),
  req("Joint account bank statements", "Banking", ["bank_statement"], {
    scope: "household",
    frequency: "monthly",
    defaultCount: 3,
    required: false,
    description: "Last three months of statements for any joint account.",
  }),
  savingsReq(),
  loanReq(),
  otherIncomeReq(),
  maritalReq(),
  purchaseReq(),
  renovationReq(),
  selfEmployedRegistrationReq(),
  selfEmployedAccountsReq(3, "annual"),
  selfEmployedBankReq(),
  guarantorIdReq(),
  guarantorAddressReq(),
  guarantorEmploymentReq(),
  guarantorIncomeReq(),
  guarantorUndertakingReq(),
];

const ukRental = genericRentalReqs({
  extras: [
    req("Right to rent share code", "Other", ["generic"], {
      required: false,
      description: "Share code or immigration status evidence where required in the UK.",
    }),
    req("Previous landlord reference", "Housing", ["reference_letter"], {
      required: false,
      description: "A reference from a previous landlord or letting agent.",
    }),
  ],
});

const ukMortgage = genericMortgageReqs();

const usRental = genericRentalReqs({
  payslipCount: 2,
  bankCount: 2,
  taxCount: 2,
  extras: [
    req("Rental history or landlord reference", "Housing", ["reference_letter"], {
      required: false,
      description: "Evidence of previous tenancy and payment history.",
    }),
  ],
});

const usMortgage = genericMortgageReqs({ payslipCount: 2, bankCount: 2, taxCount: 2 });

const germanyRental = genericRentalReqs({
  extras: [
    req("Schufa credit report", "Other", ["generic"], {
      required: false,
      description: "Current consumer credit report, where requested by the landlord.",
    }),
    req("Landlord clearance certificate", "Housing", ["generic"], {
      required: false,
      description: "Mietschuldenfreiheitsbescheinigung or an equivalent statement.",
    }),
  ],
});

const germanyMortgage = genericMortgageReqs();

const spainRental = genericRentalReqs({
  extras: [
    req("NIE / residence document", "Identity", ["proof_of_address", "generic"], {
      required: false,
      description: "NIE certificate, residence card or equivalent status document where applicable.",
    }),
  ],
});

const spainMortgage = genericMortgageReqs();

const italyRental = genericRentalReqs({
  extras: [
    req("Codice fiscale certificate", "Identity", ["generic"], {
      required: false,
      description: "Tax code certificate or health card.",
    }),
  ],
});

const italyMortgage = genericMortgageReqs();

const netherlandsRental = genericRentalReqs({
  extras: [
    req("Employer statement", "Employment", ["employment_letter"], {
      required: false,
      description: "Werkgeversverklaring or equivalent employer statement.",
    }),
  ],
});

const netherlandsMortgage = genericMortgageReqs();

const portugalRental = genericRentalReqs({
  extras: [
    req("NIF / tax number document", "Identity", ["generic"], {
      required: false,
      description: "Portuguese tax number evidence where applicable.",
    }),
  ],
});

const portugalMortgage = genericMortgageReqs();

const belgiumRental = genericRentalReqs({
  extras: [
    req("Previous rent receipts", "Housing", ["rent_receipt"], {
      frequency: "monthly",
      defaultCount: 3,
      description: "Recent receipts from a previous tenancy, where available.",
    }),
  ],
});

const belgiumMortgage = genericMortgageReqs();

const canadaRental = genericRentalReqs({
  payslipCount: 2,
  bankCount: 3,
  taxCount: 1,
  extras: [
    req("Rental history or landlord reference", "Housing", ["reference_letter"], {
      required: false,
      description: "A reference from a previous landlord.",
    }),
  ],
});

const canadaMortgage = genericMortgageReqs({ payslipCount: 2, bankCount: 3, taxCount: 2 });

export const COUNTRY_PACKS = {
  fr: {
    name: "France",
    locale: "fr-FR",
    currency: "EUR",
    rental: franceRental,
    mortgage: franceMortgage,
    note: "France checklist follows the user-provided rental and mortgage requirements. Local practice varies.",
  },
  gb: {
    name: "United Kingdom",
    locale: "en-GB",
    currency: "GBP",
    rental: ukRental,
    mortgage: ukMortgage,
    note: "UK names and document conventions vary by nation and lender.",
  },
  us: {
    name: "United States",
    locale: "en-US",
    currency: "USD",
    rental: usRental,
    mortgage: usMortgage,
    note: "US landlords and lenders may substitute credit reports, verification services or state-specific forms.",
  },
  de: {
    name: "Germany",
    locale: "de-DE",
    currency: "EUR",
    rental: germanyRental,
    mortgage: germanyMortgage,
    note: "German housing files often include Schufa and landlord clearance documents.",
  },
  es: {
    name: "Spain",
    locale: "es-ES",
    currency: "EUR",
    rental: spainRental,
    mortgage: spainMortgage,
    note: "Spanish requirements vary by region, landlord and lender.",
  },
  it: {
    name: "Italy",
    locale: "it-IT",
    currency: "EUR",
    rental: italyRental,
    mortgage: italyMortgage,
    note: "Italian requirements vary by landlord, lender and tax status.",
  },
  nl: {
    name: "Netherlands",
    locale: "nl-NL",
    currency: "EUR",
    rental: netherlandsRental,
    mortgage: netherlandsMortgage,
    note: "Dutch rental files commonly include an employer statement and recent bank statements.",
  },
  pt: {
    name: "Portugal",
    locale: "pt-PT",
    currency: "EUR",
    rental: portugalRental,
    mortgage: portugalMortgage,
    note: "Portuguese requirements vary by landlord, bank and residency status.",
  },
  be: {
    name: "Belgium",
    locale: "fr-BE",
    currency: "EUR",
    rental: belgiumRental,
    mortgage: belgiumMortgage,
    note: "Belgian requirements can differ by region and lender.",
  },
  ca: {
    name: "Canada",
    locale: "en-CA",
    currency: "CAD",
    rental: canadaRental,
    mortgage: canadaMortgage,
    note: "Canadian requirements vary by province, landlord and lender.",
  },
  other: {
    name: "Other country",
    locale: "en-GB",
    currency: "EUR",
    rental: genericRentalReqs(),
    mortgage: genericMortgageReqs(),
    note: "Start from the international checklist and edit every requirement to match local practice.",
  },
};

export function getPack(countryCode) {
  return COUNTRY_PACKS[countryCode] || COUNTRY_PACKS.other;
}

export function requirementsFor(type, countryCode) {
  const pack = getPack(countryCode);
  const source = type === "mortgage" ? pack.mortgage : type === "rental" ? pack.rental : pack.rental;
  return source.map((requirement) => ({ ...requirement, id: uid("req") }));
}

export function buildDossier({ title, type, countryCode, countryName }) {
  const pack = getPack(countryCode);
  const actualCountryName = countryName || pack.name;
  return {
    id: uid("dossier"),
    title: title || `${type === "mortgage" ? "Mortgage" : "Rental"} dossier — ${actualCountryName}`,
    type: type === "mortgage" ? "mortgage" : "rental",
    country: actualCountryName,
    countryCode,
    locale: pack.locale,
    currency: pack.currency,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    context: {
      propertyAddress: "",
      monthlyRent: "",
      purchasePrice: "",
      landlordName: "",
      lenderName: "",
      notaryName: "",
      applicationDate: new Date().toISOString().slice(0, 10),
    },
    persons: [
      {
        id: uid("person"),
        role: "applicant",
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
      },
    ],
    requirements: requirementsFor(type, countryCode),
    documents: [],
    uploads: [],
  };
}

export function roleLabel(role, type = "rental") {
  const labels = type === "mortgage"
    ? { applicant: "Borrower", coapplicant: "Co-borrower", guarantor: "Guarantor" }
    : { applicant: "Tenant", coapplicant: "Co-tenant", guarantor: "Guarantor" };
  return labels[role] || labels.applicant;
}

const monthPeriod = (offset) => {
  const now = new Date();
  const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
};

const endOfMonthDate = (period) => {
  const [year, month] = period.split("-").map(Number);
  const d = new Date(Date.UTC(year, month || 12, 0));
  return d.toISOString().slice(0, 10);
};

export function defaultTemplateData(templateId, person, dossier, period) {
  const base = {
    id_card: {
      documentNumber: person.idNumber || "23FR48172",
      issueDate: "2021-06-14",
      expiryDate: person.idExpiry || "2031-06-13",
      authority: "Préfecture de Paris",
      portrait: "assets/portrait-placeholder.png",
    },
    passport: {
      documentNumber: person.passportNumber || "24AX73190",
      issueDate: "2022-03-08",
      expiryDate: "2032-03-07",
      authority: "Préfecture de Police de Paris",
      mrzNumber: person.passportNumber || "24AX73190",
      portrait: "assets/portrait-placeholder.png",
    },
    employment_contract: {
      employerName: person.employerName || "Atelier Nord",
      employerAddress: person.employerAddress || "31 rue du Faubourg Saint-Antoine, 75011 Paris",
      jobTitle: person.jobTitle || "Senior product designer",
      contractType: person.contractType || "Permanent",
      startDate: person.startDate || "2022-09-01",
      workHours: "35 h / week",
      workplace: "Paris, with two remote days",
      grossMonthly: person.grossMonthly || "4200",
      signatoryName: "Sophie Bernard",
      signatoryRole: "People director",
      issueDate: "2024-01-12",
    },
    employment_letter: {
      employerName: person.employerName || "Horizon Santé",
      employerAddress: person.employerAddress || "8 avenue Foch, 69006 Lyon",
      jobTitle: person.jobTitle || "Operations manager",
      contractType: person.contractType || "Permanent",
      startDate: person.startDate || "2018-04-16",
      grossMonthly: person.grossMonthly || "5100",
      signatoryName: "Claire Delorme",
      signatoryRole: "HR partner",
      issueDate: "2026-10-20",
    },
    payslip: {
      employerName: person.selfEmployed ? (person.businessName || "Studio Laurent") : (person.employerName || "Atelier Nord"),
      employerAddress: person.employerAddress || "31 rue du Faubourg Saint-Antoine, 75011 Paris",
      jobTitle: person.jobTitle || "Senior product designer",
      employeeNumber: "EMP-0427",
      socialNumber: "1 89 06 75 108 042 21",
      grossMonthly: person.grossMonthly || "4200",
      netMonthly: person.netMonthly || "3290",
      bonus: person.role === "guarantor" ? "0" : "150",
      overtime: "0",
      payDate: endOfMonthDate(period || monthPeriod(0)),
      iban: person.iban || "FR76 3000 4008 2800 0123 4567 890",
    },
    tax_notice: {
      fiscalYear: period || String(new Date().getFullYear() - 1),
      taxReference: "13 07 75248 1042",
      referenceIncome: person.role === "guarantor" ? "61200" : "48600",
      taxableIncome: person.role === "guarantor" ? "54180" : "42350",
      taxDue: person.role === "guarantor" ? "4260" : "3120",
      parts: person.role === "guarantor" ? "2" : "1",
      taxOffice: "Service des impôts des particuliers — Paris 11e",
      issueDate: `${Number(period || new Date().getFullYear() - 1) + 1}-09-03`,
    },
    rent_receipt: {
      landlordName: "SCI Oberkampf",
      landlordAddress: "17 rue de la Roquette, 75011 Paris",
      propertyAddress: dossier.context.propertyAddress || "42 rue Oberkampf, 75011 Paris",
      monthlyRent: "1840",
      monthlyCharges: "110",
      paymentDate: `${period || monthPeriod(0)}-05`,
      paymentMethod: "SEPA transfer",
      landlordSignature: "J. Morel",
    },
    accommodation_certificate: {
      hostName: "Nadia Laurent",
      hostAddress: "14 rue des Capucins, 69001 Lyon",
      hostPhone: "+33 6 18 42 72 09",
      propertyAddress: "14 rue des Capucins, 69001 Lyon",
      startDate: "2025-09-01",
      endDate: "2026-08-31",
      hostSignature: "N. Laurent",
    },
    proof_of_address: {
      providerName: "Métropole Énergie",
      providerAddress: "12 cours Saint-Louis, 33000 Bordeaux",
      service: "Electricity and gas — household supply",
      accountNumber: "ME-830294711",
      documentDate: "2026-10-12",
      periodLabel: "September 2026",
      amountDue: "94.30",
      paymentDue: "2026-10-27",
    },
    bank_statement: {
      bankName: "Banque Horizon",
      bankAddress: "27 boulevard Haussmann, 75009 Paris",
      accountType: "Current account",
      iban: person.iban || "FR76 3000 4008 2800 0123 4567 890",
      accountNumber: "4008 2800 0123",
      openingBalance: person.role === "guarantor" ? "15420" : "3840",
      closingBalance: person.role === "guarantor" ? "16870" : "5210",
      statementReference: "BH-2026-1029-4471",
    },
    savings_statement: {
      bankName: "Banque Horizon",
      bankAddress: "27 boulevard Haussmann, 75009 Paris",
      accountType: "Savings account",
      iban: "FR76 3000 4008 2800 0987 6543 210",
      balance: person.role === "guarantor" ? "34500" : "28600",
      documentDate: "2026-10-29",
      signatoryName: "Élodie Marchand",
      signatoryRole: "Client advisor",
    },
    loan_schedule: {
      lenderName: "Banque Horizon",
      loanReference: "PRET-AUTO-77104",
      loanAmount: "24000",
      monthlyPayment: "412",
      remainingBalance: "13780",
      rate: "3.4",
      termMonths: 60,
      documentDate: "2026-10-29",
    },
    business_registration: {
      companyName: person.businessName || "Studio Laurent",
      registrationNumber: person.registrationNumber || "912 482 776",
      legalForm: "SASU",
      shareCapital: "5,000 EUR",
      registeredAddress: "86 rue de Charonne, 75011 Paris",
      registrationDate: "2021-11-08",
      activity: "Design and digital product consulting",
      representative: person.fullName,
    },
    urssaf_declaration: {
      companyName: person.businessName || "Studio Laurent",
      registrationNumber: person.registrationNumber || "912 482 776",
      declarationType: "Monthly",
      turnover: "7350",
      contributions: "1228",
      previousBalance: "0",
      declarationDate: `${period || monthPeriod(0)}-15`,
    },
    annual_accounts: {
      companyName: person.businessName || "Studio Laurent",
      registrationNumber: person.registrationNumber || "912 482 776",
      revenue: "98200",
      netIncome: "41600",
      totalAssets: "132400",
      equity: "86200",
      documentDate: "2026-06-30",
      accountantName: "Cabinet Rive Est",
    },
    marital_status: {
      status: "Married",
      spouseName: "Hugo Laurent",
      registryOffice: "Mairie du 11e arrondissement",
      certificateNumber: "2024/75011/0427",
      issueDate: "2024-07-12",
      signatoryName: "Martine Colin",
    },
    purchase_agreement: {
      propertyAddress: "18 rue de la Folie Méricourt, 75011 Paris",
      price: "612000",
      deposit: "61200",
      vendorName: "Madame Anne Durand",
      buyerNames: "Camille Martin and Hugo Laurent",
      notaryName: "Maître Laurent Vidal",
      signingDate: "2026-09-28",
      completionDate: "2027-01-15",
      agreementReference: "CV-2026-0918",
    },
    renovation_quote: {
      contractorName: "Atelier Bâti Sud",
      contractorAddress: "6 passage des Ateliers, 75012 Paris",
      propertyAddress: "18 rue de la Folie Méricourt, 75011 Paris",
      quoteNumber: "DEV-2026-1044",
      issueDate: "2026-10-04",
      validUntil: "2026-11-04",
      lineItems: "Kitchen replumbing and tiling | 1 | 4200\nBathroom refresh | 1 | 6350\nElectrical upgrade | 1 | 3850\nInterior painting | 1 | 2100",
      vatRate: "10",
      contractorSignature: "P. Rami",
    },
    guarantor_letter: {
      guarantorName: person.fullName,
      guarantorAddress: person.address || "14 rue des Capucins, 69001 Lyon",
      relationship: "Mother of the applicant",
      guarantorIncome: "61200",
      propertyAddress: dossier.context.propertyAddress || "42 rue Oberkampf, 75011 Paris",
      guaranteeDuration: "36 months",
      issueDate: "2026-10-18",
      signature: person.fullName,
    },
    reference_letter: {
      authorName: "Jacques Morel",
      authorRole: "Landlord",
      companyName: "SCI Oberkampf",
      companyAddress: "17 rue de la Roquette, 75011 Paris",
      relationship: "Previous landlord",
      startDate: "2023-09-01",
      endDate: "2026-08-31",
      statement: "Camille has been a reliable tenant and has consistently paid rent on time. The apartment was kept in excellent condition and the tenancy ended with no outstanding balance.",
      issueDate: "2026-10-10",
      signature: "J. Morel",
    },
    income_summary: {
      salaryIncome: person.netMonthly || "3290",
      otherIncome: "420",
      housingCost: "1950",
      loanPayments: "412",
      otherCommitments: "180",
      savings: "28600",
      summaryPeriod: "Last three months",
      issueDate: "2026-10-29",
    },
    application_letter: {
      recipientName: "Madame Morel",
      recipientRole: "Letting manager",
      recipientCompany: "SCI Oberkampf",
      propertyAddress: dossier.context.propertyAddress || "42 rue Oberkampf, 75011 Paris",
      monthlyRent: "1950",
      intro: "I am writing to present our application for the apartment at 42 rue Oberkampf. My partner and I have stable professional income and can provide a complete, organised file.",
      issueDate: "2026-10-29",
      signature: person.fullName,
    },
    generic: {
      title: "Supporting document",
      subtitle: "Issuer-issued evidence",
      body: "This document supports the applicant file and should be completed by the relevant issuer or authority.",
      issuerName: "Issuer name",
      issuerAddress: "",
      reference: "DOC-2026-001",
      issueDate: "2026-10-20",
      signature: "",
    },
  };
  return { ...base[templateId] };
};

export function buildSampleDossier() {
  const dossier = buildDossier({
    title: "Rental dossier — Paris 11e",
    type: "rental",
    countryCode: "fr",
  });
  dossier.context = {
    propertyAddress: "42 rue Oberkampf, 75011 Paris",
    monthlyRent: "1950",
    purchasePrice: "612000",
    landlordName: "SCI Oberkampf",
    lenderName: "Banque Horizon",
    notaryName: "Maître Laurent Vidal",
    applicationDate: "2026-10-29",
  };
  dossier.persons = [
    {
      id: uid("person"),
      role: "applicant",
      fullName: "Camille Martin",
      birthDate: "1993-06-18",
      birthPlace: "Lyon (69)",
      nationality: "French",
      sex: "F",
      address: "6 rue de la Roquette, 75011 Paris",
      email: "camille.martin@example.com",
      phone: "+33 6 24 81 30 77",
      idNumber: "23FR48172",
      idExpiry: "2031-06-13",
      passportNumber: "24AX73190",
      passportExpiry: "2032-03-07",
      employerName: "Atelier Nord",
      employerAddress: "31 rue du Faubourg Saint-Antoine, 75011 Paris",
      jobTitle: "Senior product designer",
      contractType: "Permanent",
      startDate: "2022-09-01",
      grossMonthly: "4200",
      netMonthly: "3290",
      selfEmployed: false,
      businessName: "",
      registrationNumber: "",
      bankName: "Banque Horizon",
      iban: "FR76 3000 4008 2800 0123 4567 890",
      savingsBalance: "28600",
    },
    {
      id: uid("person"),
      role: "coapplicant",
      fullName: "Hugo Laurent",
      birthDate: "1991-02-04",
      birthPlace: "Nantes (44)",
      nationality: "French",
      sex: "M",
      address: "6 rue de la Roquette, 75011 Paris",
      email: "hugo.laurent@example.com",
      phone: "+33 6 71 43 82 18",
      idNumber: "21FR30291",
      idExpiry: "2029-11-02",
      passportNumber: "23PA48201",
      passportExpiry: "2031-08-19",
      employerName: "Studio Laurent",
      employerAddress: "86 rue de Charonne, 75011 Paris",
      jobTitle: "Founder and design consultant",
      contractType: "Freelance",
      startDate: "2021-11-08",
      grossMonthly: "3450",
      netMonthly: "2600",
      selfEmployed: true,
      businessName: "Studio Laurent",
      registrationNumber: "912 482 776",
      bankName: "Banque Horizon",
      iban: "FR76 3000 4008 2800 0456 7890 123",
      savingsBalance: "18900",
    },
    {
      id: uid("person"),
      role: "guarantor",
      fullName: "Nadia Laurent",
      birthDate: "1965-10-22",
      birthPlace: "Annecy (74)",
      nationality: "French",
      sex: "F",
      address: "14 rue des Capucins, 69001 Lyon",
      email: "nadia.laurent@example.com",
      phone: "+33 6 18 42 72 09",
      idNumber: "12FR77620",
      idExpiry: "2032-04-15",
      passportNumber: "22PL19480",
      passportExpiry: "2032-10-11",
      employerName: "Horizon Santé",
      employerAddress: "8 avenue Foch, 69006 Lyon",
      jobTitle: "Operations manager",
      contractType: "Permanent",
      startDate: "2018-04-16",
      grossMonthly: "5100",
      netMonthly: "3900",
      selfEmployed: false,
      businessName: "",
      registrationNumber: "",
      bankName: "Banque Horizon",
      iban: "FR76 3000 4008 2800 0999 1111 222",
      savingsBalance: "34500",
    },
  ];

  const [camille, hugo, nadia] = dossier.persons;
  const findReq = (prefix) => dossier.requirements.find((r) => r.label.startsWith(prefix));
  const addDoc = (templateId, prefix, person, period, titleSuffix = "") => {
    const requirement = findReq(prefix);
    if (!requirement) return;
    dossier.documents.push({
      id: uid("doc"),
      templateId,
      requirementId: requirement.id,
      personId: person?.id || null,
      period: period || "",
      data: defaultTemplateData(templateId, person || camille, dossier, period),
      title: `${TEMPLATES[templateId].short}${period ? ` — ${period}` : ""}${titleSuffix ? ` — ${titleSuffix}` : ""}`,
      createdAt: "2026-10-29T10:30:00.000Z",
    });
  };

  addDoc("id_card", "Valid ID", camille);
  addDoc("passport", "Valid ID", hugo);
  addDoc("employment_contract", "Employment contract", camille);
  addDoc("business_registration", "Employment contract", hugo);
  addDoc("business_registration", "Proof of business", hugo);
  addDoc("employment_letter", "Employment contract", nadia);

  [2, 1, 0].forEach((offset) => {
    const period = monthPeriod(offset);
    addDoc("payslip", "Last 3 payslips", camille, period, camille.fullName);
    addDoc("payslip", "Last 3 payslips", hugo, period, hugo.fullName);
    addDoc("payslip", "Guarantor’s proof of income", nadia, period, nadia.fullName);
  });

  addDoc("tax_notice", "Latest income tax", camille, "2025", camille.fullName);
  addDoc("tax_notice", "Latest income tax", hugo, "2025", hugo.fullName);
  [2, 1, 0].forEach((offset) => {
    const period = monthPeriod(offset);
    addDoc("rent_receipt", "Rent receipts", camille, period, camille.fullName);
  });
  addDoc("accommodation_certificate", "Rent receipts", hugo);
  addDoc("id_card", "Guarantor’s valid ID", nadia);
  addDoc("proof_of_address", "Guarantor’s proof", nadia);
  addDoc("employment_letter", "Guarantor’s employment", nadia);
  addDoc("guarantor_letter", "Signed guarantor undertaking", nadia);

  return dossier;
}

export const SAMPLE_TEMPLATE_NOTES = {
  id_card: "Identity facsimile",
  payslip: "Monthly pay statement",
  bank_statement: "Current account statement",
};
