import { readFileSync } from "fs";
import path from "node:path";
import { cwd } from "node:process";

/**
 * Returns true if the project is dependant on a package.
 */
export function projectDependency(packageName: string) {
	return projectDependencies().some((dep) => dep === packageName);
}

/**
 * Returns all project dependencies
 */
export function projectDependencies() {
	const packageJson = parsePackageJson();
	return Object.keys(packageJson.dependencies ?? {});
}

function parsePackageJson() {
	return JSON.parse(readFileSync(path.join(cwd(), "package.json")).toString());
}
