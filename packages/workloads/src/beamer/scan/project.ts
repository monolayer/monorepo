import { readFileSync } from "fs";
import path from "node:path";
import { cwd } from "node:process";

export function projectDependency(packageName: string) {
	const packageJson = JSON.parse(
		readFileSync(path.join(cwd(), "package.json")).toString(),
	);
	const deps = Object.keys(packageJson.dependencies ?? {});
	return deps.some((dep) => dep === packageName);
}
