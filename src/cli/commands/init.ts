import * as p from "@clack/prompts";
import { program } from "commander";
import { exit } from "process";
import { checkKyselyInstallation } from "../actions/check_kysely.js";
import { initFolderAndFiles } from "../actions/init_folders_and_files.js";
import { installKysely } from "../actions/install_kysely.js";
import { ActionStatus } from "../command.js";
import { exitProgramWithError } from "../utils/program.js";

export async function initCommand() {
	p.intro("Initialize Kinetic");
	const check = await checkKyselyInstallation();
	if (check.status === ActionStatus.KyselyInstallationNotInstalled) {
		const result = await installKysely();
		if (result.status === ActionStatus.Error)
			exitProgramWithError(program, result.error);
	}
	await initFolderAndFiles();

	const nextSteps = `1) Edit the database connection details at \`.kinetic.ts\`.
2) Run \`npx kinetic db:create\` to create the database.
3) Edit the schema file at \`app/db/schema.ts\`.
4) Run \'npx kinetic kinetic generate\' to create migrations.
5) Run \'npx kinetic migrate\' to migrate the database.`;
	p.note(nextSteps, "Next Steps");
	p.outro("Kinetic initialized successfully.");
	exit(0);
}
