import { expect, test } from "@playwright/test";
import { SEED_USER, uniqueEmail } from "./fixtures/auth";

test.describe("Inscription", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("affiche le formulaire d'inscription", async ({ page }) => {
    await expect(page).toHaveTitle(/Inscription/);
    await expect(page.getByRole("heading", { name: "Inscription" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Last name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Valider" })).toBeVisible();
  });

  test("crée un compte et redirige vers la connexion", async ({ page }) => {
    const email = uniqueEmail("signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("secret123");
    await page.getByLabel("First name").fill("Alice");
    await page.getByLabel("Last name").fill("Martin");
    await page.getByRole("button", { name: "Valider" }).click();

    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole("heading", { name: "Connection" })).toBeVisible();
  });

  test("refuse un email déjà utilisé", async ({ page }) => {
    await page.getByLabel("Email").fill(SEED_USER.email);
    await page.getByLabel("Mot de passe").fill("secret123");
    await page.getByLabel("First name").fill("Dup");
    await page.getByLabel("Last name").fill("Licate");
    await page.getByRole("button", { name: "Valider" }).click();

    await expect(page).toHaveURL(/\/signup$/);
  });
});
