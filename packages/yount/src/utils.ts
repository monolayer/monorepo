import * as p from "@clack/prompts";
import { createHash } from "crypto";
import { existsSync, writeFileSync } from "fs";
import color from "picocolors";

export function createFile(path: string, content: string, log = true): void {
	const overwrite = existsSync(path);
	writeFileSync(path, content);
	if (log) {
		logCreation(path, overwrite);
	}
}

function logCreation(path: string, overwritten = false): void {
	p.log.info(`${color.green(overwritten ? "overwritten" : "created")} ${path}`);
}

export function hashValue(value: string) {
	const hash = createHash("sha256");
	hash.update(value);
	return hash.digest("hex").substring(0, 8);
}
