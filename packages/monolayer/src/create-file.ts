import { existsSync, writeFileSync } from "fs";
import { logCreation } from "./utils.js";

export function createFile(path: string, content: string, log = true): void {
	const overwrite = existsSync(path);
	writeFileSync(path, content);
	if (log) {
		logCreation(path, overwrite);
	}
}
