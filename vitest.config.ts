/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
	test: {
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
		},
		setupFiles: ["tests/setup.ts"],
		reporters: ["verbose"],
	},
});
