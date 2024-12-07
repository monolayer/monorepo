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

/**
 * Returns the project name (from package.json)
 */
export function projectName() {
	const packageJson = parsePackageJson();
	if (packageJson.name) {
		return packageJson.name as string;
	}
}

function parsePackageJson() {
	return JSON.parse(readFileSync(path.join(cwd(), "package.json")).toString());
}
