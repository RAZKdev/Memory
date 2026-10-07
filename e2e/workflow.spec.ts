import { test, expect } from "@playwright/test";

test.describe("MemoryVault System E2E & Visual QA", () => {
  test("Landing Page: renders branding, domain model, and primary navigation", async ({ page }) => {
    await page.goto("/");

    // Verify Title & Hero
    await expect(page).toHaveTitle(/MemoryVault/);
    await expect(page.locator("h1")).toContainText("Sistem memori dan konteks teknis");

    // Verify Main Navigation Links
    const nav = page.locator("nav[aria-label='Main Navigation']");
    await expect(nav.getByRole("link", { name: "Memori" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Keputusan (ADR)" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Koleksi & Ekspor AI" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Proyek & Tata Kelola" })).toBeVisible();

    // Verify Domain Model Section
    await expect(page.locator("#domain")).toBeVisible();
    await expect(page.getByText("ProjectScope", { exact: false })).toBeVisible();
    await expect(page.getByText("Memory & MemoryVersion", { exact: false })).toBeVisible();
  });

  test("Memories Workspace: lists seeded memories and creates new memory with version 1", async ({ page }) => {
    await page.goto("/memories");

    // Verify seeded memory exists
    await expect(page.getByText("Deterministic State Transition Rule").first()).toBeVisible();
    await expect(page.getByText("v1", { exact: true }).first()).toBeVisible();

    // Open New Memory Modal
    await page.getByRole("button", { name: "Tambah Memori" }).click();
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Simpan Memori Teknis")).toBeVisible();

    // Fill form using exact element IDs
    await page.locator("#create-title").fill("Playwright E2E Memory Verification");
    await page.locator("#create-content").fill("Verifying full-stack reactivity and persistence across App Router.");
    await page.locator("#create-tags").fill("e2e, testing, playwright");
    await page.locator("#create-author").fill("qa-automation-bot");

    // Submit form
    await modal.getByRole("button", { name: "Simpan Memori" }).click();

    // Wait for modal to close and new memory to appear
    await expect(modal).not.toBeVisible();
    await expect(page.getByText("Playwright E2E Memory Verification").first()).toBeVisible();
  });

  test("Decisions (ADRs) Workspace: lists decisions and opens create modal", async ({ page }) => {
    await page.goto("/decisions");

    // Verify seeded decision (first in list or detail)
    await expect(page.getByText("ADR-001: Boundary Port-Adapter Architecture").first()).toBeVisible();
    await expect(page.getByText("accepted", { exact: false }).first()).toBeVisible();

    // Open New ADR Modal
    await page.getByRole("button", { name: "Catat ADR" }).click();
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Catat Keputusan Arsitektur (ADR)")).toBeVisible();

    // Fill and submit
    await page.locator("#decision-title").fill("ADR-002: Dual-Mode Persistence Strategy");
    await page.locator("#decision-context").fill("Need seamless offline testing without requiring Supabase credentials.");
    await page.locator("#decision-text").fill("Maintain zero-config in-memory adapter as primary dev fallback.");
    await page.locator("#decision-consequences").fill("Faster developer feedback loop with identical domain port.");

    await modal.getByRole("button", { name: "Simpan Keputusan" }).click();
    await expect(modal).not.toBeVisible();
    await expect(page.getByText("ADR-002: Dual-Mode Persistence Strategy").first()).toBeVisible();
  });

  test("Collections Workspace & AI Export: exports prompt context in multiple formats", async ({ page }) => {
    await page.goto("/collections");

    // Verify seeded collection
    await expect(page.getByText("Agentic Determinism & Boundary Invariants").first()).toBeVisible();

    // Open Export Context Modal
    await page.getByRole("button", { name: "Ekspor Prompt AI" }).click();
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Paket Injeksi Konteks AI")).toBeVisible();

    // Verify export formats and preview content
    await expect(modal.getByText("Markdown (Standar)")).toBeVisible();
    await expect(modal.getByText("XML (Claude / Gemini)")).toBeVisible();
    await expect(modal.getByText("JSON (Alat / API)")).toBeVisible();

    // Switch to XML tab
    await modal.getByRole("button", { name: "XML (Claude / Gemini)" }).click();
    await expect(modal.locator("pre")).toContainText("<project_context");

    // Switch to JSON tab
    await modal.getByRole("button", { name: "JSON (Alat / API)" }).click();
    await expect(modal.locator("pre")).toContainText('"collectionId"');

    // Close modal
    await modal.getByRole("button", { name: "Tutup modal ekspor" }).click();
    await expect(modal).not.toBeVisible();
  });

  test("Project Scope Governance: configures access policy and isolation boundary", async ({ page }) => {
    await page.goto("/projects");

    // Verify seeded scopes
    await expect(page.getByText("Agentic Architecture")).toBeVisible();
    await expect(page.getByText("Data Platform")).toBeVisible();

    // Click Policy button on the first project card
    const firstPolicyBtn = page.getByRole("button", { name: "Kebijakan" }).first();
    await firstPolicyBtn.click();

    // Access Policy Modal
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Tata Kelola Kebijakan Akses")).toBeVisible();

    // Select Shared Read
    await modal.locator("input[value='shared_read']").check();

    // Verify whitelist peer project checkbox exists
    const whitelistCheckbox = modal.locator("input[type='checkbox']").first();
    if (await whitelistCheckbox.isVisible()) {
      await whitelistCheckbox.check();
    }

    // Submit policy
    await modal.getByRole("button", { name: "Simpan Kebijakan" }).click();
    await expect(modal).not.toBeVisible();

    // Verify updated badge reflects Shared Read
    await expect(page.getByText("Shared (", { exact: false }).first()).toBeVisible();
  });

  test("Hybrid Vector Search: queries memories with relevance ranking", async ({ page }) => {
    await page.goto("/memories");

    // Open Search modal via button
    await page.getByRole("button", { name: "Pencarian Hybrid" }).click();
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();

    // Enter query
    const searchInput = modal.locator("input[type='text']");
    await searchInput.fill("deterministic");

    // Verify search results appear
    await expect(modal.getByText("Deterministic State Transition Rule")).toBeVisible();
    await expect(modal.getByText("Relevansi", { exact: false }).first()).toBeVisible();

    // Close modal via close button
    await modal.getByRole("button", { name: "Tutup pencarian" }).click();
    await expect(modal).not.toBeVisible();
  });

  test("Responsive Viewport QA: ensures no horizontal overflow on mobile viewports", async ({ page }) => {
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // zero or negligible subpixel rounding

    // Test /memories on current viewport
    await page.goto("/memories");
    const memScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const memClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(memScrollWidth).toBeLessThanOrEqual(memClientWidth + 2);

    // Test /projects on current viewport
    await page.goto("/projects");
    const projScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const projClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(projScrollWidth).toBeLessThanOrEqual(projClientWidth + 2);
  });
});
