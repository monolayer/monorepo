import ora from "ora";
import { addDefaultImport } from "./add-import.js";
import { replaceStringWithIdendentifier } from "./replace-string.js";
import { writeWorkload } from "./workload.js";

export function postgresDatabaseWorkload(opts: { id: string; name: string }) {
	return `import { PostgresDatabase } from "@monolayer/sdk";

const ${opts.name} = new PostgresDatabase("${opts.id}");

export default ${opts.name};
`;
}

export function addPostgresWorkload(opts: { name: string; id: string }) {
	const template = postgresDatabaseWorkload(opts);
	const spinner = ora();
	spinner.start(`Create postgres workload in ./workloads/${opts.id}.ts`);
	writeWorkload(opts.id, template);
	spinner.succeed();
}

export async function addDefaultImports(
	opts: { id: string; name: string },
	files: { rootConfigFile: string; clientFile: string },
) {
	const spinner = ora();
	spinner.start("Adapt configuration");
	await addDefaultImport(
		files.rootConfigFile,
		`./workloads/${opts.id}`,
		"database",
	);
	await addDefaultImport(
		files.clientFile,
		`@/workloads/${opts.id}`,
		"database",
	);
	replaceStringWithIdendentifier({
		from: "DATABASE_URL",
		to: "database.connectionStringEnvVar",
		files: [files.rootConfigFile, files.clientFile],
	});
	spinner.succeed();
}
