import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import architecture from "./scripts/eslintArchitecture.cjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/{features,components,hooks,lib,config,types,utils,api,testing}/**/*.{ts,tsx}"],
    plugins: { architecture },
    rules: { "architecture/import-boundaries": "error" },
  },
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      // CommonJS verification scripts use require() to load Node.js modules.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-migration/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
