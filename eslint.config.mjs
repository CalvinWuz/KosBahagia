import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party files copied by scripts/salin-maplibre.mjs.
    "public/maplibre/**",
    // Node/CommonJS helper that builds the presentation deck; not app code.
    "docs/presentasi/**",
  ]),
]);

export default eslintConfig;
