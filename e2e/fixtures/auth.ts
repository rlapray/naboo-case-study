import { expect, type Page } from "@playwright/test";

export const SEED_USER = {
  email: "user1@test.fr",
  password: "user1",
  firstName: "John",
  lastName: "Doe",
};

export async function signInAs(
  page: Page,
  credentials: { email: string; password: string } = SEED_USER,
) {
  await page.goto("/signin");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mot de passe").fill(credentials.password);
  await page.getByRole("button", { name: "Valider" }).click();
  // Après login, l'app navigue hors de /signin. La cible précise (/profil ou /) varie
  // selon une race avec le HOC withoutAuth ; on ne teste ici que la sortie de /signin.
  await page.waitForURL((url) => !url.pathname.endsWith("/signin"));
}

export function uniqueEmail(prefix = "test") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.fr`;
}
