module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:react/recommended",
		"prettier",
	],
	overrides: [
		{
			env: {
				node: true,
			},
			files: [".eslintrc.{js,cjs}"],
			parserOptions: {
				sourceType: "script",
			},
		},
	],
	ignorePatterns: [
		"**/node_modules/**",
		"**/dist/**",
		"**/coverage/**",
		"**/tmp/**",
		"files/**",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	plugins: ["@typescript-eslint", "react"],
	rules: {
		indent: ["off", "tab"],
		"linebreak-style": ["error", "unix"],
		quotes: ["off", "double"],
		semi: ["off", "always"],
	},
};
