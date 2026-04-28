import type { City } from "@/utils";

const GEO_API = "https://geo.api.gouv.fr";

export async function searchCity(search: string): Promise<City[]> {
  const url = `${GEO_API}/communes?nom=${encodeURIComponent(search)}&fields=departement&boost=population&limit=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`searchCity failed: ${res.status}`);
  return (await res.json()) as City[];
}
