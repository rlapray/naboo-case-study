// @vitest-environment node
import { describe, expect, it } from "vitest";

interface HeaderEntry {
  key: string;
  value: string;
}

interface HeadersRule {
  source: string;
  headers: HeaderEntry[];
}

interface NextConfig {
  headers: () => Promise<HeadersRule[]>;
}

describe("next.config security headers", () => {
  it("emits a hardened header bundle on every route", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require("../../../next.config.js") as NextConfig;
    const rules = await config.headers();
    expect(rules).toHaveLength(1);
    const rule = rules[0]!;
    expect(rule.source).toBe("/:path*");

    const byKey = Object.fromEntries(
      rule.headers.map((h) => [h.key, h.value]),
    ) as Record<string, string>;

    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toMatch(/strict-origin/);
    expect(byKey["Permissions-Policy"]).toMatch(/camera=\(\)/);
    const csp = byKey["Content-Security-Policy"]!;
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/connect-src.*geo\.api\.gouv\.fr/);
  });
});
