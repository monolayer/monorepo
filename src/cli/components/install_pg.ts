import * as p from "@clack/prompts";
import { program } from "commander";
import { ActionStatus, CommandSuccess, isExecaError } from "../command.js";
import { npmInstall, npmList } from "../utils/npm.js";
import { exitProgramWithError } from "../utils/program.js";

export async function checkPgTypesInstallation(): Promise<CommandSuccess> {
	const s = p.spinner();
	s.start("Check @types/pg");
	const isInstalled = await npmList(["@types/pg"]);
	if (isInstalled.success === false) {
		if (
			isExecaError(isInstalled.error) &&
			isInstalled.error.failed === true &&
			isInstalled.error.stdout !== undefined &&
			isInstalled.error.stdout.includes("(empty)")
		) {
			s.stop("@types/pg not in package.json", 1);
			return {
				status: ActionStatus.pgTypesInstallationNotInstalled,
			};
		}
		exitProgramWithError(program, isInstalled.error);
	}
	s.stop("@types/pg in package.json", 0);
	return {
		status: ActionStatus.pgTypesInstallationInstalled,
	};
}

export async function installPgTypes(): Promise<CommandSuccess> {
	const s = p.spinner();
	s.start("Installing @types/pg via npm");
	const installResult = await npmInstall(["@types/pg", "--save-dev"]);
	if (installResult.success === false)
		exitProgramWithError(program, installResult);
	s.stop("Installed @types/pg via npm");
	return {
		status: ActionStatus.InstallPgTypesSuccess,
	};
}
