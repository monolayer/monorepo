import * as p from "@clack/prompts";
import { createHash } from "crypto";
import { Effect } from "effect";
import { stat } from "fs/promises";
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

export function pathExists(filePath: string) {
	return Effect.tryPromise(async () => {
		try {
			await stat(filePath);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.code === "ENOENT") {
				return false;
			}
			throw error;
		}
		return true;
	});
}
