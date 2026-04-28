import "@testing-library/jest-dom/vitest";

// Default server-env values for tests. Individual tests may override JWT_*
// before the env is first read; MONGO_URI is unused at runtime (the in-memory
// db helper passes a URI explicitly) but the zod schema still requires it.
process.env.JWT_SECRET ??= "test_secret";
process.env.JWT_EXPIRATION_TIME ??= "3600";
process.env.MONGO_URI ??= "mongodb://placeholder";

// Mantine v7+ utilise window.matchMedia pour la gestion du color scheme.
// jsdom ne l'implémente pas — on le mocke uniquement dans les environnements browser (jsdom).
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
