import { frameworkList } from "@vercel/frameworks";
import {
	detectFrameworks,
	LocalFileSystemDetector,
} from "@vercel/fs-detectors";
import { readFileSync } from "fs";
import { spawn } from "node:child_process";
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

/**
 * Returns the installed version of a package or `undefined` if the package is not installed.
 */
export async function packageVersion(
	packageName: string,
	projectRoot?: string,
) {
	const list = await npmList(projectRoot);
	return (list.dependencies ?? {})[packageName]?.version;
}

async function npmList(projectRoot?: string) {
	return new Promise<PackageList>((resolve, reject) => {
		const lines: string[] = [];
		const list = spawn(
			"npm",
			["list", "--json"],
			projectRoot
				? {
						cwd: projectRoot,
					}
				: undefined,
		);

		list.stdout.on("data", (chunks) => lines.push(chunks.toString()));
		list.stderr.on("data", (chunks) => reject(chunks.toString()));
		list.on("close", (code) => {
			if (code !== 0) {
				throw new Error(`npm list command finished with code ${code}`);
			}
			resolve(JSON.parse(lines.join()));
		});
	});
}

type PackageList = {
	name: string;
	dependencies?: Record<
		string,
		{
			version: string;
			resolved: string;
			overridden: boolean;
		}
	>;
};
