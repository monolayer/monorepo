import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts", "test/**/*.test.ts"],
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
			include: ["src/**/*.ts"],
		},
		setupFiles: ["test/__setup__/setup.ts"],
		reporters: ["verbose"],
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
