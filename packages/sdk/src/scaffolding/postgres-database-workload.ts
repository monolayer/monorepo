import { writeFileSync } from "fs";
import ora from "ora";
import path from "path";
import { addDefaultImport } from "./add-import.js";
import { replaceStringWithIdendentifier } from "./replace-string.js";

export function postgresDatabaseWorkload(id: string) {
	return `import { PostgresDatabase } from "@monolayer/sdk";

const database = new PostgresDatabase("${id}");

export default database;
`;
}

export function addPostgresWorkload(databaseId: string) {
	const template = postgresDatabaseWorkload(databaseId);
	const spinner = ora();
	spinner.start(`Create postgres workload in ./workloads/${databaseId}.ts`);
	writeFileSync(path.join("workloads", `${databaseId}.ts`), template);
	spinner.succeed();
}

export async function addDefaultImports(
	databaseId: string,
	files: { rootConfigFile: string; clientFile: string },
) {
	const spinner = ora();
	spinner.start("Adapt configuration");
	await addDefaultImport(
		files.rootConfigFile,
		`./workloads/${databaseId}`,
		"database",
	);
	await addDefaultImport(
		files.clientFile,
		`@/workloads/${databaseId}`,
		"database",
	);
	replaceStringWithIdendentifier({
		from: "DATABASE_URL",
		to: "database.connectionStringEnvVar",
		files: [files.rootConfigFile, files.clientFile],
	});
	spinner.succeed();
}
