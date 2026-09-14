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
    ".open-next/**",
    ".wrangler/**",
    "cloudflare-env.d.ts",
    "out/**",
    "build/**",
    "docs/**",
    "media-source/**",
    // Local, git-ignored diagnostic scripts and generated review artifacts.
    "tmp/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
