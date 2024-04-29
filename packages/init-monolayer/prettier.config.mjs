// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs

/** @type {import("prettier").Config} */
const config = {
	trailingComma: "all",
	useTabs: true,
	tabWidth: 2,
	semi: true,
	singleQuote: false,
	plugins: ["prettier-plugin-organize-imports"],
};

export default config;
