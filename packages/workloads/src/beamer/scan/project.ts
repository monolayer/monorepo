import { readFileSync } from "fs";
import path from "node:path";
import { cwd } from "node:process";

export function projectDependency(packageName: string) {
	return projectDependencies().some((dep) => dep === packageName);
}

export function projectDependencies() {
	const packageJson = parsePackageJson();
	return Object.keys(packageJson.dependencies ?? {});
}

function parsePackageJson() {
	return JSON.parse(readFileSync(path.join(cwd(), "package.json")).toString());
}
