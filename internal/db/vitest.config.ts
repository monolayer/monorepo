import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const config = defineConfig({
	test: {
		name: "commands",
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
			exclude: ["**/tmp/**", "**/tests/**", "**/docs/**"],
		},
		setupFiles: ["tests/__setup__/setup.ts"],
		reporters: ["default"],
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});

export default config;
