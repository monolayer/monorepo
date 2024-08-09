import * as p from "@clack/prompts";

import { existsSync, writeFileSync } from "fs";
import path from "path";
import color from "picocolors";

export function createFile(
	filePath: string,
	content: string,
	log = true,
): void {
	const overwritten = existsSync(filePath);
	writeFileSync(filePath, content);
	if (log) {
		const relativePath = path.relative(process.cwd(), filePath);
		p.log.info(
			`${color.green(overwritten ? "overwritten" : "created")} ${relativePath}`,
		);
	}
}
