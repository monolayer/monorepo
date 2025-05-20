import { fail, gen, tryPromise } from "effect/Effect";
import { promises as fs, mkdirSync, writeFileSync } from "fs";
import nunjucks from "nunjucks";
import ora from "ora";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import {
	UndefinedWorkloadsFolderError,
	WorkloadsFolderState,
} from "../state/workloads-folder.js";

function createFileFromTemplate(
	banner: string,
	content: string,
	relativePath: string,
) {
	return gen(function* () {
		const spinner = ora();
		spinner.start(banner);
		const result = yield* tryPromise(() =>
			createFile(path.join(cwd(), relativePath), content),
		);
		switch (result) {
			case "exists":
				spinner.succeed(`${banner} ${color.yellow("exists")}`);
				break;
			case "created":
				spinner.succeed();
				break;
		}
	});
}

export const initFolderAndFiles = gen(function* () {
	const workloadsFolder = yield* WorkloadsFolderState.current;
	const workloadsFolderPath = workloadsFolder?.path;
	if (workloadsFolderPath === undefined) {
		yield* fail(new UndefinedWorkloadsFolderError());
	} else {
		yield* createFileFromTemplate(
			"Create workloads.config.ts",
			configTemplate.render({
				workloadsPath: workloadsFolderPath,
			}),
			"workloads.config.ts",
		);
		yield* tryPromise(() => createDir(workloadsFolderPath));
		yield* createFileFromTemplate(
			`Create ${workloadsFolderPath}/.gitkeep`,
			"",
			`${workloadsFolderPath}/.gitkeep`,
		);
	}
});

export async function createDir(path: string) {
	try {
		await fs.access(path);
	} catch {
		mkdirSync(path, { recursive: true });
	}
}

export async function createFile(path: string, content: string) {
	try {
		await fs.access(path);
		return "exists";
	} catch {
		writeFileSync(path, content);
		return "created";
	}
}

export const configTemplate =
	nunjucks.compile(`import type { Configuration } from "@monolayer/workloads";

const config: Configuration = {
  workloadsPath: "{{ workloadsPath }}",
};

export default config;
`);
