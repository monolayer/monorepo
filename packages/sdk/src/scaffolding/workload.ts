import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

export function writeWorkload(name: string, content: string) {
	createWorkloadsDir();
	writeFileSync(path.join("workloads", `${name}.ts`), content);
}

function createWorkloadsDir() {
	const dir = path.join("workloads");
	if (existsSync(dir)) return;
	mkdirSync(dir);
}
