import { test } from "@playwright/test";

test("landing loads without errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.goto("http://127.0.0.1:4173/");
  await page.waitForTimeout(1000);
  console.log("ERRORS", JSON.stringify(errors, null, 2));
  await page.locator("#heroDocs .hero-paper").first().waitFor();
});

test("sample opens and screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.goto("http://127.0.0.1:4173/#sample");
  await page.waitForTimeout(1800);
  console.log("ERRORS", JSON.stringify(errors, null, 2));
  await page.screenshot({ path: "sample.png", fullPage: true });
});

test("documents and generator", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:4173/#sample");
  await page.waitForTimeout(900);
  await page.locator('.nav-item[data-tab="documents"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "documents.png" });
  await page.locator('.doc-file[data-action="preview-doc"]').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "preview.png" });
  await page.locator('[data-action="edit-doc"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "generator.png" });
  console.log("ERRORS", JSON.stringify(errors, null, 2));
});

test("exports a ZIP", async ({ page }) => {
  test.setTimeout(150000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:4173/#sample");
  await page.waitForTimeout(700);
  await page.locator('.nav-item[data-tab="export"]').click();
  const downloadPromise = page.waitForEvent("download", { timeout: 120000 });
  await page.locator('.export-hero [data-action="export-zip"]').click();
  const download = await downloadPromise;
  await download.saveAs("export.zip");
  console.log("EXPORT", download.suggestedFilename());
  console.log("ERRORS", JSON.stringify(errors, null, 2));
});

test("creates a country dossier, generates records and uploads an original", async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:4173/");
  await page.locator('.hero [data-action="start-dossier"]').click();
  await page.locator('#setupForm input[value="mortgage"]').check();
  await page.selectOption("#setupCountry", "us");
  await page.locator('#setupForm button[type="submit"]').click();
  await page.locator("#personName").fill("Alex Morgan");
  await page.locator("#personEmail").fill("alex.morgan@example.com");
  await page.locator("#personNet").fill("5600");
  await page.locator('#personForm button[type="submit"]').click();
  await page.locator('.nav-item[data-tab="documents"]').click();
  const payslipSlot = page.locator(".doc-slot").filter({ hasText: "payslips" }).first();
  await payslipSlot.locator('[data-action="generate-slot"]').first().click();
  await page.locator('#generateForm button[type="submit"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "generated-records.png" });
  const firstSlot = page.locator(".doc-slot").first();
  const chooserPromise = page.waitForEvent("filechooser");
  await firstSlot.locator('[data-action="upload-slot"]').first().click();
  const chooser = await chooserPromise;
  await chooser.setFiles("assets/portrait-placeholder.png");
  await page.waitForTimeout(500);
  const originalsText = await page.locator(".stats-strip").innerText();
  console.log("STATS", originalsText.replaceAll("\n", " | "));
  await page.locator('.nav-item[data-tab="export"]').click();
  const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
  await page.locator('.export-hero [data-action="export-zip"]').click();
  const download = await downloadPromise;
  await download.saveAs("uploaded.zip");
  console.log("ERRORS", JSON.stringify(errors, null, 2));
});

test("renders every document template", async ({ page }) => {
  await page.goto("/#sample");
  const results = await page.evaluate(async () => {
    const data = await import("/js/data.js");
    const docs = await import("/js/documents.js");
    const dossier = data.buildSampleDossier();
    const person = dossier.persons[0];
    return Object.keys(data.TEMPLATES).map((templateId) => {
      try {
        const template = data.TEMPLATES[templateId];
        const period = template.series === "annual" ? "2025" : template.series === "monthly" ? "2026-10" : "";
        const doc = {
          id: `test-${templateId}`,
          templateId,
          requirementId: dossier.requirements[0].id,
          personId: person.id,
          period,
          data: data.defaultTemplateData(templateId, person, dossier, period),
          title: templateId,
        };
        const html = docs.renderDocument(doc, dossier);
        return { templateId, ok: html.includes('class="doc-page"'), length: html.length };
      } catch (error) {
        return { templateId, ok: false, error: error.stack || error.message };
      }
    });
  });
  console.log("TEMPLATES", results.map((item) => `${item.templateId}:${item.ok}`).join(" "));
  const failed = results.filter((item) => !item.ok);
  if (failed.length) console.log(JSON.stringify(failed, null, 2));
  if (results.length !== 23 || failed.length) throw new Error(`Template render failed: ${failed.length}`);
});
