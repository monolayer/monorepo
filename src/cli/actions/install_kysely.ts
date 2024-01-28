import * as p from "@clack/prompts";
import { program } from "commander";
import { ActionStatus, CommandSuccess } from "../command.js";
import { npmInstall } from "../utils/npm.js";
import { exitProgramWithError } from "../utils/program.js";

export async function installKysely(): Promise<CommandSuccess> {
	const s = p.spinner();
	s.start("Installing Kysely via npm");
	const installResult = await npmInstall("kysely");
	if (installResult.success === false)
		exitProgramWithError(program, installResult);
	s.stop("Installed Kysely via npm");
	return {
		status: ActionStatus.InstallKyselySuccess,
	};
}
