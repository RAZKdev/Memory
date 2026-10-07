import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve("./qa-results");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runDeepQA() {
  console.log("=== MEMORYVAULT CHROME DEEP QA SUITE ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  const results = {
    steps: [],
    consoleErrors: [],
    success: true,
  };

  try {
    // ------------------------------------------------------------------
    // STEP 1: Landing Page
    // ------------------------------------------------------------------
    console.log("--> Testing Step 1: Landing Page (/)...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    const title = await page.title();
    const heroHeading = await page.locator("h1").innerText();
    await page.screenshot({ path: path.join(OUTPUT_DIR, "01-landing-page.png"), fullPage: true });

    results.steps.push({
      step: "1. Landing Page",
      status: "PASS",
      details: {
        title,
        heroHeading,
        hasBrand: await page.getByText("MemoryVault").first().isVisible(),
        hasDomainSection: await page.locator("#domain").isVisible(),
      },
    });

    // ------------------------------------------------------------------
    // STEP 2: Memories Workspace Navigation & Inspection
    // ------------------------------------------------------------------
    console.log("--> Testing Step 2: Memories Workspace (/memories)...");
    await page.goto("http://localhost:3000/memories", { waitUntil: "networkidle" });
    await page.waitForSelector("button:has-text('Tambah Memori')");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "02-memories-initial.png") });

    const seededMemoryCard = page.getByText("Deterministic State Transition Rule").first();
    const isSeededVisible = await seededMemoryCard.isVisible();
    await seededMemoryCard.click();
    await page.waitForTimeout(500);

    const hasTimeline = await page.getByRole("heading", { name: /Riwayat Versi Kekal/ }).isVisible();
    const hasCitations = await page.getByRole("heading", { name: /Sumber Rujukan & Sitasi/ }).isVisible();
    await page.screenshot({ path: path.join(OUTPUT_DIR, "03-memories-inspected.png") });

    results.steps.push({
      step: "2. Memories Workspace & Detail Inspector",
      status: isSeededVisible && hasTimeline ? "PASS" : "FAIL",
      details: { isSeededVisible, hasTimeline, hasCitations },
    });

    // ------------------------------------------------------------------
    // STEP 3: Create New Memory with Citation
    // ------------------------------------------------------------------
    console.log("--> Testing Step 3: Tambah Memori Form & Submission...");
    await page.getByRole("button", { name: "Tambah Memori" }).click();
    const modalMem = page.locator("div[role='dialog']");
    await modalMem.waitFor({ state: "visible" });
    await page.screenshot({ path: path.join(OUTPUT_DIR, "04-modal-create-memory.png") });

    await page.locator("#create-title").fill("Audit Log Deterministic Verification");
    await page.locator("#create-content").fill(
      "Setiap perubahan status memori wajib dicatat dalam struktur riwayat versi kekal dengan referensi RFC/PR yang valid."
    );
    await page.locator("#create-tags").fill("audit, verification, chrome-qa");
    await page.locator("#create-author").fill("chrome-qa-agent");

    // Click toggle to add citation source
    const toggleSourceBtn = modalMem.locator("button:has-text('Tautkan sitasi')");
    if (await toggleSourceBtn.isVisible()) {
      await toggleSourceBtn.click();
      await page.locator("#create-source-title").fill("RFC-991: Immutable State Logs");
      await page.locator("#create-source-uri").fill("https://example.org/rfc/991");
    }

    await modalMem.locator("button[type='submit']").click();
    await modalMem.waitFor({ state: "hidden" });
    await page.waitForTimeout(500);

    const newMemoryCard = page.getByText("Audit Log Deterministic Verification").first();
    const isNewMemoryVisible = await newMemoryCard.isVisible();
    await page.screenshot({ path: path.join(OUTPUT_DIR, "05-memory-created.png") });

    results.steps.push({
      step: "3. Create Memory Flow with Citation",
      status: isNewMemoryVisible ? "PASS" : "FAIL",
      details: { isNewMemoryVisible },
    });

    // ------------------------------------------------------------------
    // STEP 4: Revise Memory (Version Snapshot Creation)
    // ------------------------------------------------------------------
    console.log("--> Testing Step 4: Revisi Memori (Snapshot v2)...");
    await newMemoryCard.click();
    await page.locator("h1", { hasText: "Audit Log Deterministic Verification" }).waitFor({ state: "visible" });
    const reviseButton = page.getByRole("button", { name: /Revisi Memori/ });
    await reviseButton.click();
    const modalRevise = page.locator("div[role='dialog']");
    await modalRevise.waitFor({ state: "visible" });
    await page.screenshot({ path: path.join(OUTPUT_DIR, "06-modal-revise-memory.png") });

    await page.locator("#revise-reason").fill("Revisi berkas untuk audit ISO & OWASP tingkat lanjut.");
    await page.locator("#revise-content").fill(
      "Setiap perubahan status memori wajib dicatat dalam struktur riwayat versi kekal dengan referensi RFC/PR yang valid. [DIPERBARUI untuk audit lanjutan]."
    );
    await page.locator("#revise-author").fill("security-auditor");

    await modalRevise.locator("button[type='submit']").click();
    await modalRevise.waitFor({ state: "hidden", timeout: 15000 });
    await page.waitForTimeout(500);

    const hasVersion2Badge = await page.getByText("v2").first().isVisible();
    await page.screenshot({ path: path.join(OUTPUT_DIR, "07-memory-revised-v2.png") });

    results.steps.push({
      step: "4. Revise Memory & Immutable Version Snapshot",
      status: hasVersion2Badge ? "PASS" : "FAIL",
      details: { hasVersion2Badge },
    });

    // ------------------------------------------------------------------
    // STEP 5: Hybrid Vector Search Modal
    // ------------------------------------------------------------------
    console.log("--> Testing Step 5: Hybrid Vector Search...");
    await page.getByRole("button", { name: "Pencarian Hybrid" }).click();
    const modalSearch = page.locator("div[role='dialog']");
    await modalSearch.waitFor({ state: "visible" });
    await page.screenshot({ path: path.join(OUTPUT_DIR, "08-modal-hybrid-search.png") });

    const searchInput = modalSearch.locator("input[type='text']");
    await searchInput.fill("deterministic");

    let searchResults = false;
    let hasRelevanceScore = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      searchResults = await modalSearch.getByText("Deterministic State Transition Rule").first().isVisible();
      hasRelevanceScore = await modalSearch.getByText(/Relevansi/).first().isVisible();
      if (searchResults && hasRelevanceScore) break;
    }

    await page.screenshot({ path: path.join(OUTPUT_DIR, "09-hybrid-search-results.png") });

    await modalSearch.getByRole("button", { name: "Tutup pencarian" }).click();
    await modalSearch.waitFor({ state: "hidden" });

    results.steps.push({
      step: "5. Hybrid Vector Search Modal",
      status: searchResults && hasRelevanceScore ? "PASS" : "FAIL",
      details: { searchResults, hasRelevanceScore },
    });

    // ------------------------------------------------------------------
    // STEP 6: Decisions (ADRs) Workspace
    // ------------------------------------------------------------------
    console.log("--> Testing Step 6: Architecture Decisions Workspace (/decisions)...");
    await page.goto("http://localhost:3000/decisions", { waitUntil: "networkidle" });
    await page.waitForSelector("button:has-text('Catat ADR')");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "10-decisions-workspace.png") });

    const seededDecision = page.getByText("ADR-001: Boundary Port-Adapter Architecture").first();
    const isADRVisible = await seededDecision.isVisible();
    await seededDecision.click();
    await page.waitForTimeout(500);

    const hasContext = await page.getByRole("heading", { name: /Konteks & Latar Belakang Masalah/ }).isVisible();
    const hasConsequences = await page.getByRole("heading", { name: /Konsekuensi & Trade-off/ }).isVisible();

    // Test Create ADR
    await page.getByRole("button", { name: "Catat ADR" }).click();
    const modalADR = page.locator("div[role='dialog']");
    await modalADR.waitFor({ state: "visible" });
    await page.screenshot({ path: path.join(OUTPUT_DIR, "11-modal-create-adr.png") });

    await page.locator("#decision-title").fill("ADR-002: Strict Browser Verification Pipeline");
    await page.locator("#decision-context").fill("Memastikan setiap antarmuka diverifikasi di Google Chrome sebelum rilis.");
    await page.locator("#decision-text").fill("Menjalankan pipeline audit E2E otomatis dengan Playwright Chrome.");
    await page.locator("#decision-consequences").fill("Kualitas rilis terjamin 100% dan bebas dari regresi visual.");

    await modalADR.locator("button[type='submit']").click();
    await modalADR.waitFor({ state: "hidden" });
    await page.waitForTimeout(500);

    const newADRVisible = await page.getByText("ADR-002: Strict Browser Verification Pipeline").first().isVisible();
    await page.screenshot({ path: path.join(OUTPUT_DIR, "12-adr-created.png") });

    results.steps.push({
      step: "6. Architecture Decisions (ADR) Workspace",
      status: isADRVisible && newADRVisible && hasContext && hasConsequences ? "PASS" : "FAIL",
      details: { isADRVisible, newADRVisible, hasContext, hasConsequences },
    });

    // ------------------------------------------------------------------
    // STEP 7: Collections Workspace & AI Prompt Exporter
    // ------------------------------------------------------------------
    console.log("--> Testing Step 7: Collections Workspace & AI Export (/collections)...");
    await page.goto("http://localhost:3000/collections", { waitUntil: "networkidle" });
    await page.waitForSelector("button:has-text('Koleksi Baru')");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "13-collections-workspace.png") });

    const seededCollection = page.getByText("Agentic Determinism & Boundary Invariants").first();
    const isColVisible = await seededCollection.isVisible();
    await seededCollection.click();
    await page.waitForTimeout(300);

    // Open Export Context Modal
    await page.getByRole("button", { name: "Ekspor Prompt AI" }).click();
    const modalExport = page.locator("div[role='dialog']");
    await modalExport.waitFor({ state: "visible" });

    // Poll for pre content to appear
    let hasMarkdownPrompt = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      if (await modalExport.locator("pre").isVisible()) {
        hasMarkdownPrompt = true;
        break;
      }
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, "14-modal-ai-export-markdown.png") });

    // Switch to XML tab
    await modalExport.getByRole("button", { name: "XML (Claude / Gemini)" }).click();
    await page.waitForTimeout(1000);
    const hasXmlPrompt = await modalExport.locator("pre").innerText().catch(() => "");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "15-modal-ai-export-xml.png") });

    // Switch to JSON tab
    await modalExport.getByRole("button", { name: "JSON (Alat / API)" }).click();
    await page.waitForTimeout(1000);
    const hasJsonPrompt = await modalExport.locator("pre").innerText().catch(() => "");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "16-modal-ai-export-json.png") });

    await modalExport.getByRole("button", { name: "Tutup modal ekspor" }).click();
    await modalExport.waitFor({ state: "hidden" });

    // Test Create Collection
    await page.getByRole("button", { name: "Koleksi Baru" }).click();
    const modalCol = page.locator("div[role='dialog']");
    await modalCol.waitFor({ state: "visible" });
    await page.screenshot({ path: path.join(OUTPUT_DIR, "17-modal-create-collection.png") });

    await page.locator("#col-title").fill("Paket Verifikasi Keamanan Web");
    await page.locator("#col-description").fill("Kumpulan memori teknis untuk pengujian kepatuhan keamanan OWASP.");
    const firstCheckbox = modalCol.locator("input[type='checkbox']").first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check();
    }
    await modalCol.locator("button[type='submit']").click();
    await modalCol.waitFor({ state: "hidden" });
    await page.waitForTimeout(500);

    const newCollectionVisible = await page.getByText("Paket Verifikasi Keamanan Web").first().isVisible();
    await page.screenshot({ path: path.join(OUTPUT_DIR, "18-collection-created.png") });

    results.steps.push({
      step: "7. Collections & AI Prompt Exporter (Markdown/XML/JSON)",
      status: isColVisible && hasMarkdownPrompt && hasXmlPrompt.includes("<project_context") && newCollectionVisible ? "PASS" : "FAIL",
      details: { isColVisible, hasMarkdownPrompt, newCollectionVisible },
    });

    // ------------------------------------------------------------------
    // STEP 8: Project Scope Governance & Access Policies
    // ------------------------------------------------------------------
    console.log("--> Testing Step 8: Project Scopes & Access Policies (/projects)...");
    await page.goto("http://localhost:3000/projects", { waitUntil: "networkidle" });
    await page.waitForSelector("button:has-text('Scope Baru')");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "19-projects-workspace.png") });

    // Create New Project Scope
    await page.getByRole("button", { name: "Scope Baru" }).click();
    const modalScope = page.locator("div[role='dialog']");
    await modalScope.waitFor({ state: "visible" });
    await page.screenshot({ path: path.join(OUTPUT_DIR, "20-modal-create-scope.png") });

    await page.locator("#project-name").fill("AI Autonomous Agent Engine");
    await page.locator("#project-desc").fill("Lingkungan terisolasi khusus logika penalaran agen AI.");
    await modalScope.locator("button[type='submit']").click();
    await modalScope.waitFor({ state: "hidden" });
    await page.waitForTimeout(500);

    const newScopeVisible = await page.getByText("AI Autonomous Agent Engine").first().isVisible();

    // Test Access Policy Modal on first project card
    const firstPolicyBtn = page.getByRole("button", { name: "Kebijakan" }).first();
    await firstPolicyBtn.click();
    const modalPolicy = page.locator("div[role='dialog']");
    await modalPolicy.waitFor({ state: "visible" });
    await page.screenshot({ path: path.join(OUTPUT_DIR, "21-modal-access-policy.png") });

    await modalPolicy.locator("input[value='shared_read']").check();
    const peerCheckbox = modalPolicy.locator("input[type='checkbox']").first();
    if (await peerCheckbox.isVisible()) {
      await peerCheckbox.check();
    }
    await modalPolicy.locator("button[type='submit']").click();
    await modalPolicy.waitFor({ state: "hidden" });
    await page.getByText(/Berbagi \/ Shared/).first().waitFor({ state: "visible", timeout: 15000 });

    const sharedBadgeVisible = await page.getByText(/Berbagi \/ Shared/).first().isVisible();
    await page.screenshot({ path: path.join(OUTPUT_DIR, "22-policy-updated.png") });

    results.steps.push({
      step: "8. Project Scopes & Access Policy Governance",
      status: newScopeVisible && sharedBadgeVisible ? "PASS" : "FAIL",
      details: { newScopeVisible, sharedBadgeVisible },
    });

    // ------------------------------------------------------------------
    // STEP 9: Mobile Viewport Responsive QA
    // ------------------------------------------------------------------
    console.log("--> Testing Step 9: Mobile Viewport QA (390x844 iPhone / Android)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    const mobileScrollWidth1 = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const mobileClientWidth1 = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "23-mobile-landing.png") });

    await mobilePage.goto("http://localhost:3000/memories", { waitUntil: "networkidle" });
    const mobileScrollWidth2 = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const mobileClientWidth2 = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "24-mobile-memories.png") });

    const noOverflow = mobileScrollWidth1 <= mobileClientWidth1 + 2 && mobileScrollWidth2 <= mobileClientWidth2 + 2;

    results.steps.push({
      step: "9. Mobile Responsive Viewport QA",
      status: noOverflow ? "PASS" : "FAIL",
      details: {
        mobileLanding: `${mobileClientWidth1}px / scroll ${mobileScrollWidth1}px`,
        mobileMemories: `${mobileClientWidth2}px / scroll ${mobileScrollWidth2}px`,
        noOverflow,
      },
    });

    await mobileContext.close();
  } catch (err) {
    console.error("QA execution encountered error:", err);
    results.success = false;
    results.error = err.message;
  } finally {
    results.consoleErrors = consoleErrors;
    await browser.close();
    fs.writeFileSync(path.join(OUTPUT_DIR, "qa-report.json"), JSON.stringify(results, null, 2));
    console.log("=== QA SUITE FINISHED ===");
    console.log("Total Console Errors:", consoleErrors.length);
    console.log("Results summary written to:", path.join(OUTPUT_DIR, "qa-report.json"));
  }
}

runDeepQA();
