import "@testing-library/jest-dom/vitest";

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
