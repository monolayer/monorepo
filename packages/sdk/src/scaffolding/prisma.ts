import { execSync } from "child_process";
import ora from "ora";
import { exit } from "process";
import { PostgresDatabase } from "~workloads/workloads.js";
import { addEnvVar } from "./add-env-var.js";
import { addScriptToPackageJson } from "./add-script.js";
import {
	addDefaultImports,
	addPostgresWorkload,
} from "./postgres-database-workload.js";

const registryJSON = "http://localhost:3000/r/prisma-pg.json";

export async function addPrismaPosgres(databaseId: string) {
	execSync(`npx shadcn@latest add ${registryJSON}`, { stdio: "inherit" });
	addPostgresWorkload(databaseId);
	await addDefaultImports(databaseId, {
		rootConfigFile: "prisma.config.ts",
		clientFile: "lib/prisma/prisma.ts",
	});
	await addEnvVar(
		new PostgresDatabase(databaseId).connectionStringEnvVar,
		`postgresql://postgres:postgres@localhost:5432/${databaseId}`,
	);
	const spinner = ora();
	await addScriptToPackageJson("db:migrate", "npx prisma migrate dev");
	await addScriptToPackageJson("db:deploy", "npx prisma migrate deploy");
	await addScriptToPackageJson("db:seed", "npx prisma db seed");
	await addScriptToPackageJson("db:studio", "npx prisma studio");

	spinner.start("Generate prisma client");
	await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
	try {
		execSync("npx prisma generate", { stdio: "ignore" });
		spinner.succeed();
	} catch (e) {
		spinner.fail("Failed to generate prisma client");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		console.error(e as any);
		exit(1);
	}
}
