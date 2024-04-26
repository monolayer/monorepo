import * as p from "@clack/prompts";
import { createHash } from "crypto";
import path from "path";
import color from "picocolors";

export function logCreation(filePath: string, overwritten = false): void {
	const relativePath = path.relative(process.cwd(), filePath);
	p.log.info(
		`${color.green(overwritten ? "overwritten" : "created")} ${relativePath}`,
	);
}

export function hashValue(value: string) {
	const hash = createHash("sha256");
	hash.update(value);
	return hash.digest("hex").substring(0, 8);
}
