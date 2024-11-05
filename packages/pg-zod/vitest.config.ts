import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "pg-zod",
		include: ["src/**/*.test.ts", "test/**/*.test.ts"],
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
			include: ["src/**/*.ts"],
		},
		reporters: ["verbose"],
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
