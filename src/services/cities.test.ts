import { afterEach, describe, expect, it, vi } from "vitest";
import { searchCity } from "./cities";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("searchCity", () => {
  it("encode la query, cible l'API geo.api.gouv.fr et renvoie la liste", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([{ nom: "Saint-Étienne" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await searchCity("Saint Étienne");

    expect(result).toEqual([{ nom: "Saint-Étienne" }]);
    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("https://geo.api.gouv.fr/communes");
    expect(calledUrl).toContain("nom=Saint%20%C3%89tienne");
    expect(calledUrl).toContain("fields=departement");
    expect(calledUrl).toContain("limit=5");
  });

  it("propage une erreur si la réponse HTTP n'est pas ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("boom", { status: 500 }),
    );

    await expect(searchCity("Paris")).rejects.toThrow(/500/);
  });
});
