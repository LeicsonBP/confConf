import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      "src/lib/supabase/database.types.ts",
      ".ops/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
