export interface City {
  nom: string;
  code: string;
  codesPostaux?: string[];
  departement?: {
    code: string;
    nom: string;
  };
  population?: number;
}
