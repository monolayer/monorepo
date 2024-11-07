import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import typescriptESLint from "@typescript-eslint/eslint-plugin";
import typescriptESLintParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

console.dir(typescriptESLint);
export default [
	includeIgnoreFile(gitignorePath),
	{
		files: ["src/**/*.ts"],
		...js.configs.recommended,
		plugins: {
			typescript: typescriptESLint,
		},
		languageOptions: {
			parser: typescriptESLintParser,
		},
		rules: {
			...prettier.rules,
			...typescriptESLint.rules,
			"linebreak-style": ["error", "unix"],
			quotes: ["error", "double"],
			"max-lines": [
				"error",
				{ max: 300, skipComments: true, skipBlankLines: true },
			],
			complexity: ["error"],
		},
	},
];
