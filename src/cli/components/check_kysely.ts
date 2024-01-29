import * as p from "@clack/prompts";
import { program } from "commander";
import { ActionStatus, CommandSuccess, isExecaError } from "../command.js";
import { npmList } from "../utils/npm.js";
import { exitProgramWithError } from "../utils/program.js";

export async function checkKyselyInstallation(): Promise<CommandSuccess> {
	const s = p.spinner();
	s.start("Check Kysely");
	const isInstalled = await npmList(["kysely"]);
	if (isInstalled.success === false) {
		if (
			isExecaError(isInstalled.error) &&
			isInstalled.error.failed === true &&
			isInstalled.error.stdout !== undefined &&
			isInstalled.error.stdout.includes("(empty)")
		) {
			s.stop("Kysely not in package.json", 1);
			return {
				status: ActionStatus.KyselyInstallationNotInstalled,
			};
		}
		exitProgramWithError(program, isInstalled.error);
	}
	s.stop("Kysely in package.json", 0);
	return {
		status: ActionStatus.KyselyInstallationInstalled,
	};
}
