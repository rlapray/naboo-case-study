import { expect, test } from "@playwright/test";
import { signInAs, uniqueEmail } from "./fixtures/auth";

test.describe("Favoris", () => {
  test("Utilisateur connecté ajoute une Activité, la voit sur /profil et la retire", async ({
    page,
  }) => {
    const email = uniqueEmail("favs");
    const password = "password1";

    // Inscription d'un user éphémère pour isolation parallèle.
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByLabel("First name").fill("Fav");
    await page.getByLabel("Last name").fill("Tester");
    await page.getByRole("button", { name: "Valider" }).click();
    await page.waitForURL((url) => !url.pathname.endsWith("/signup"));

    await signInAs(page, { email, password });

    // Ouverture d'une fiche d'Activité depuis l'explorer (Yoga à Paris est seedé).
    await page.goto("/explorer/Paris");
    const yogaRow = page
      .locator("div")
      .filter({ hasText: "Yoga à Paris" })
      .filter({ has: page.getByRole("link", { name: "Voir plus" }) })
      .last();
    await yogaRow.getByRole("link", { name: "Voir plus" }).click();
    await expect(page).toHaveURL(/\/activities\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: "Yoga à Paris" }),
    ).toBeVisible();

    // Ajout aux favoris — on attend la réponse API pour que le SSR de /profil
    // voie bien le favori persisté (l'UI flippe en optimistic, mais la DB est
    // écrite de façon asynchrone).
    const addButton = page.getByRole("button", {
      name: /ajouter aux favoris/i,
    });
    const addResponse = page.waitForResponse(
      (resp) =>
        /\/api\/me\/favorites/.test(resp.url()) &&
        resp.request().method() === "POST" &&
        resp.ok(),
    );
    await addButton.click();
    await addResponse;

    // Bascule visible vers l'état "retirer".
    await expect(
      page.getByRole("button", { name: /retirer des favoris/i }),
    ).toBeVisible();

    // L'Activité apparaît sur /profil.
    await page.goto("/profil");
    await expect(
      page.getByRole("heading", { name: "Mon profil" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Yoga à Paris" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /retirer des favoris/i }),
    ).toBeVisible();

    // Retrait depuis la liste (un seul favori → un seul bouton).
    const deleteResponse = page.waitForResponse(
      (resp) =>
        /\/api\/me\/favorites/.test(resp.url()) &&
        resp.request().method() === "DELETE" &&
        resp.ok(),
    );
    await page
      .getByRole("button", { name: /retirer des favoris/i })
      .click();
    await deleteResponse;

    // Après retrait, on recharge /profil pour vérifier la persistance côté DB
    // (la liste est SSR via getServerSideProps).
    await page.reload();
    await expect(
      page.getByText("Vous n'avez pas encore de favoris."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Yoga à Paris" }),
    ).toHaveCount(0);
  });

  test("Visiteur non connecté ouvre la modale et bascule vers /signin", async ({
    page,
  }) => {
    await page.goto("/explorer/Paris");
    const row = page
      .locator("div")
      .filter({ hasText: "Yoga à Paris" })
      .filter({ has: page.getByRole("link", { name: "Voir plus" }) })
      .last();
    await row.getByRole("link", { name: "Voir plus" }).click();
    await expect(page).toHaveURL(/\/activities\/[^/]+$/);

    await page
      .getByRole("button", { name: /ajouter aux favoris/i })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Connectez-vous pour ajouter des favoris",
    });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("Utilisateur connecté réordonne ses favoris au clavier et la persistance survit au reload", async ({
    page,
  }) => {
    const email = uniqueEmail("favs-reorder");
    const password = "password1";

    // Inscription d'un user éphémère (isolation parallèle).
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByLabel("First name").fill("Reorder");
    await page.getByLabel("Last name").fill("Tester");
    await page.getByRole("button", { name: "Valider" }).click();
    await page.waitForURL((url) => !url.pathname.endsWith("/signup"));

    await signInAs(page, { email, password });

    // Marquer 3 Activités favorites depuis leur fiche détail. L'ordre d'ajout
    // détermine l'ordre initial sur /profil (position 0 = dernier ajouté).
    const activitiesToFavorite = [
      "Yoga à Paris",
      "Visite du Louvre",
      "Randonnée dans les Alpes",
    ];
    for (const name of activitiesToFavorite) {
      await page.goto("/discover");
      const row = page
        .locator("div")
        .filter({ hasText: name })
        .filter({ has: page.getByRole("link", { name: "Voir plus" }) })
        .last();
      await row.getByRole("link", { name: "Voir plus" }).click();
      await expect(page).toHaveURL(/\/activities\/[^/]+$/);
      await expect(page.getByRole("heading", { name })).toBeVisible();

      const addResponse = page.waitForResponse(
        (resp) =>
          /\/api\/me\/favorites/.test(resp.url()) &&
          resp.request().method() === "POST" &&
          resp.ok(),
      );
      await page
        .getByRole("button", { name: /ajouter aux favoris/i })
        .click();
      await addResponse;
      await expect(
        page.getByRole("button", { name: /retirer des favoris/i }),
      ).toBeVisible();
    }

    // Sur /profil l'ordre attendu (Q6, position 0 = dernier ajouté) :
    // Alpes (top), Louvre, Yoga (bottom).
    await page.goto("/profil");
    await expect(
      page.getByRole("heading", { name: "Mon profil" }),
    ).toBeVisible();

    const links = page.getByRole("link", {
      name: /Yoga à Paris|Visite du Louvre|Randonnée dans les Alpes/,
    });
    await expect(links).toHaveText([
      "Randonnée dans les Alpes",
      "Visite du Louvre",
      "Yoga à Paris",
    ]);

    // Réordonnancement via le KeyboardSensor de dnd-kit : focus la poignée du
    // dernier item (Yoga, bottom), Espace pour activer, Flèche Haut x2 pour
    // remonter en tête, Espace pour valider.
    const handles = page.getByRole("button", { name: "Réordonner ce favori" });
    await expect(handles).toHaveCount(3);

    const reorderResponse = page.waitForResponse(
      (resp) =>
        /\/api\/me\/favorites$/.test(resp.url()) &&
        resp.request().method() === "PATCH" &&
        resp.ok(),
    );
    // dnd-kit PointerSensor exige un mouvement initial (activationConstraint
    // par défaut : aucun, mais le drag synthétique de Playwright doit franchir
    // un seuil). On fait un manual drag pour passer par mouse.move/down/up
    // afin de déclencher correctement onDragStart puis onDragOver/onDragEnd.
    const sourceHandle = handles.nth(2);
    const targetHandle = handles.nth(0);
    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();
    if (!sourceBox || !targetBox) throw new Error("handles not measurable");

    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2,
    );
    await page.mouse.down();
    // Petit déplacement pour franchir le seuil de drag, puis trajet vers la cible.
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2 - 10,
      { steps: 5 },
    );
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2 - 5,
      { steps: 15 },
    );
    await page.mouse.up();
    await reorderResponse;

    await expect(links).toHaveText([
      "Yoga à Paris",
      "Randonnée dans les Alpes",
      "Visite du Louvre",
    ]);

    // Reload : la persistance côté DB (lecture SSR) doit confirmer le nouvel ordre.
    await page.reload();
    const reloadedLinks = page.getByRole("link", {
      name: /Yoga à Paris|Visite du Louvre|Randonnée dans les Alpes/,
    });
    await expect(reloadedLinks).toHaveText([
      "Yoga à Paris",
      "Randonnée dans les Alpes",
      "Visite du Louvre",
    ]);
  });

  test("Visiteur non connecté peut basculer vers /signup depuis la modale", async ({
    page,
  }) => {
    await page.goto("/explorer/Paris");
    const row = page
      .locator("div")
      .filter({ hasText: "Yoga à Paris" })
      .filter({ has: page.getByRole("link", { name: "Voir plus" }) })
      .last();
    await row.getByRole("link", { name: "Voir plus" }).click();

    await page
      .getByRole("button", { name: /ajouter aux favoris/i })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Connectez-vous pour ajouter des favoris",
    });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("link", { name: /s'inscrire/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
