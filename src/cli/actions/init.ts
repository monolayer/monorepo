import * as p from "@clack/prompts";
import { program } from "commander";
import { exit } from "process";
import { ActionStatus, CommandSuccess } from "../command.js";
import { initFolderAndFiles } from "../components/init_folders_and_files.js";
import {
	checkPgTypesInstallation,
	installPgTypes,
} from "../components/install_pg.js";
import { exitProgramWithError } from "../utils/program.js";

export async function initCommand() {
	p.intro("Initialize Kinetic");

	await installPackage(
		checkPgTypesInstallation,
		installPgTypes,
		ActionStatus.pgTypesInstallationNotInstalled,
	);

	await initFolderAndFiles();

	const nextSteps = `1) Edit the database connection details at \`.kinetic.ts\`.
2) Run \`npx kinetic db:create\` to create the database.
3) Edit the schema file at \`app/db/schema.ts\`.
4) Run 'npx kinetic kinetic generate' to create migrations.
5) Run 'npx kinetic migrate' to migrate the database.`;
	p.note(nextSteps, "Next Steps");

	p.outro("Kinetic initialized successfully.");

	exit(0);
}

async function installPackage(
	checkFn: () => Promise<CommandSuccess>,
	installFn: () => Promise<CommandSuccess>,
	checkStatusSuccess: ActionStatus,
) {
	const check = await checkFn();
	if (check.status === checkStatusSuccess) {
		const installResult = await installFn();
		if (installResult.status === ActionStatus.Error)
			exitProgramWithError(program, installResult.error);
	}
}
