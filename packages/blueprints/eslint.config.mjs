import tsLint from "typescript-eslint";

export default [
	...tsLint.configs.recommended,
	{
    name: 'typescript-eslint-overrides',
		files: ["src/lib/factory.ts", "src/lib/docker-context.ts"],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
	},
	{
		ignores: [
			"**/node_modules/**",
		],
	},
];
