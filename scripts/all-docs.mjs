import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://127.0.0.1:4173/#sample");
const allDocsDossier = await page.evaluate(async () => {
  const data = await import("/js/data.js");
  const dossier = data.buildSampleDossier();
  const person = dossier.persons[0];
  const requirement = dossier.requirements.find((item) => item.label.startsWith("Valid ID")) || dossier.requirements[0];
  dossier.documents = Object.keys(data.TEMPLATES).map((templateId, index) => {
    const template = data.TEMPLATES[templateId];
    const period = template.series === "annual" ? "2025" : template.series === "monthly" ? "2026-10" : "";
    return {
      id: `all-${index}`,
      templateId,
      requirementId: requirement.id,
      personId: person.id,
      period,
      data: data.defaultTemplateData(templateId, person, dossier, period),
      title: `${data.TEMPLATES[templateId].label}${period ? ` — ${period}` : ""}`,
      createdAt: new Date().toISOString(),
    };
  });
  return dossier;
});
const exportPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await exportPage.addInitScript((dossier) => localStorage.setItem("doccccs.dossier.v1", JSON.stringify(dossier)), allDocsDossier);
await exportPage.goto("http://127.0.0.1:4173/#studio");
console.log("INJECTED", allDocsDossier.documents.length, "STORED", await exportPage.evaluate(() => JSON.parse(localStorage.getItem("doccccs.dossier.v1") || "{}").documents?.length));
await exportPage.locator('.nav-item[data-tab="export"]').click();
const downloadPromise = exportPage.waitForEvent("download", { timeout: 180000 });
await exportPage.locator('.export-hero [data-action="export-zip"]').click();
const download = await downloadPromise;
await download.saveAs("all-docs.zip");
await browser.close();
console.log("all-docs.zip ready");
