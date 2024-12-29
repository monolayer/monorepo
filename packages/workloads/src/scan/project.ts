import { frameworkList } from "@vercel/frameworks";
import {
	detectFrameworks,
	LocalFileSystemDetector,
} from "@vercel/fs-detectors";
import { readFileSync } from "fs";
import path from "node:path";
import { cwd } from "node:process";

/**
 * Returns true if the project is dependant on a package.
 */
export function projectDependency(packageName: string, projectRoot?: string) {
	return projectDependencies(projectRoot).some((dep) => dep === packageName);
}

/**
 * Returns all project dependencies
 */
export function projectDependencies(projectRoot?: string) {
	const packageJson = parsePackageJson(projectRoot);
	return Object.keys(packageJson.dependencies ?? {});
}

/**
 * Returns the project name (from package.json)
 */
export function projectName(projectRoot?: string) {
	const packageJson = parsePackageJson(projectRoot);
	if (packageJson.name) {
		return packageJson.name as string;
	}
}

/**
 * Returns the slug (unique identifier) of the framework
 * used in the current project.
 *
 * Frameworks are defected wirth the package: `@vercel/fs-detectors`
 */
export async function projectFramework(projectRoot?: string) {
	const result = await detectFrameworks({
		fs: new LocalFileSystemDetector(projectRoot ?? cwd()),
		frameworkList,
	});
	return result[0]?.slug ?? undefined;
}

function parsePackageJson(projectRoot?: string) {
	return JSON.parse(
		readFileSync(path.join(projectRoot ?? cwd(), "package.json")).toString(),
	);
}
