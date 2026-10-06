import { expect, test } from "@playwright/test";

test("operator routes render the observatory", async ({ page }) => {
  await page.goto("/operator");
  await expect(page.getByText("FRONTIER OPERATOR")).toBeVisible();
  await expect(page.getByText("DEMO SEED", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /EVALS|REGIME|ACCELERATING|DOMINATES/ })).toBeVisible();

  await page.goto("/operator/tape");
  await expect(page.getByRole("heading", { name: "Event stream" })).toBeVisible();
  await expect(page.locator("td").filter({ hasText: "NEW_JOB" }).first()).toBeVisible();

  await page.goto("/operator/surface");
  await expect(page.getByRole("heading", { name: "Market surface" })).toBeVisible();

  await page.goto("/operator/xray");
  await expect(page.getByRole("heading", { name: "Posting index" })).toBeVisible();
  await page.getByRole("link", { name: /Evaluation|Reinforcement|Flywheel|Agent/ }).first().click();
  await expect(page.getByText("Capability fingerprint")).toBeVisible();
  await expect(page.getByText("Organizational signal")).toBeVisible();

  await page.goto("/operator/mandate");
  await expect(page.getByText("Senior Customer Program Manager — CAPE")).toBeVisible();

  await page.goto("/operator/allocate");
  await expect(page.getByRole("heading", { name: "Learning allocation" })).toBeVisible();

  await page.goto("/calibration");
  await expect(page.getByRole("heading", { name: "What changed in practice" })).toBeVisible();
});

test("private career data stays behind its own route", async ({ page }) => {
  await page.goto("/private");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Private Career Alpha" })).toBeVisible();
  await page.goto("/operator");
  await expect(page.getByText("Recommended role:")).toHaveCount(0);
  await page.getByRole("link", { name: "Private route" }).click();
  await page.getByLabel("Passphrase").fill("demo-operator");
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(page.getByRole("heading", { name: "Component scores" })).toBeVisible();
  await expect(page.getByText("Do not screen-share this view.")).toBeVisible();
});
