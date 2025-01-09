/** @type {import("prettier").Config} */
const config = {
	trailingComma: "all",
	useTabs: true,
	tabWidth: 2,
	semi: true,
	singleQuote: false,
	plugins: ["prettier-plugin-organize-imports"],
	printWidth: 100,
};

export default config;
