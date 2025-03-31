#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const standaloneDir = path.join(process.cwd(), ".next", "standalone");

const standaloneDirExists = existsSync(standaloneDir);

if (standaloneDirExists) {
	const adapterDir = path.join(process.cwd(), ".next", "standalone", "adapter");
	mkdirSync(adapterDir, { recursive: true });
	copyAdapter(adapterDir);
	console.log(`Installed adapter in ${standaloneDir}`);
	process.exit(0);
} else {
	console.error("Error: standalone dir not found. Have you built the app?");
	process.exit(1);
}

function copyAdapter(dest: string) {
	const packageDir = path.join(
		fileURLToPath(new URL(".", import.meta.url)),
		"..",
	);
	cpSync(path.join(packageDir, "adapter"), dest, { recursive: true });
}
