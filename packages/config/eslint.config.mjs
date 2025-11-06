import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tailwindPlugin from "eslint-plugin-tailwindcss";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

const nextRecommended = nextPlugin.configs.recommended;

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/.next/**", "**/coverage/**", "**/node_modules/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        projectService: true
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: reactPlugin,
      "jsx-a11y": jsxA11y,
      tailwindcss: tailwindPlugin,
      import: importPlugin,
      "simple-import-sort": simpleImportSort
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off",
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "import/order": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    ...(nextRecommended ?? {}),
    rules: {
      ...(nextRecommended?.rules ?? {})
    }
  }
);
