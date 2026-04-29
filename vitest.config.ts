import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Default `node` : moins de RAM que jsdom. Les fichiers de tests qui ont
    // besoin du DOM déclarent `// @vitest-environment jsdom` en tête.
    environment: "node",
    dir: "./src",
    globals: true,
    include: ["**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./src/setupTests.ts"],
    // forks (default Vitest 4) : isole mongodb-memory-server par worker.
    // Cap à 4 (sur 8 CPUs) : -50% RAM peak vs uncapped, évite l'instabilité
    // observée à 8 workers (race sur ports mongod, env JWT_*).
    maxWorkers: 4,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // tests + bootstraps
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/setupTests.ts",
        "src/**/*.d.ts",
        // types-only / déclaratif
        "src/types/**",
        "src/utils/types.ts",
        // plumbing Next.js (couvert en e2e)
        "src/pages/_app.tsx",
        "src/pages/_document.tsx",
        // HOC de redirection (couverts en e2e)
        "src/hocs/**",
        // outillage de test
        "src/**/__tests__/helpers/**",
        "src/**/__mocks__/**",
        // dev / seed
        "src/server/seed/**",
        // theme / style déclaratif
        "src/**/*.styles.ts",
        "src/utils/mantine.theme.ts",
        // barrels
        "src/**/index.ts",
        // patterns réservés (no-op aujourd'hui)
        "src/**/*.stories.{ts,tsx}",
        "src/**/__fixtures__/**",
        "src/**/*.generated.*",
      ],
    },
  },
});
