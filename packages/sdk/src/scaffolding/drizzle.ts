import { execSync } from "child_process";
import { PostgresDatabase } from "~workloads/workloads.js";
import { addEnvVar } from "./add-env-var.js";
import { addScriptToPackageJson } from "./add-script.js";
import {
	addDefaultImports,
	addPostgresWorkload,
} from "./postgres-database-workload.js";

const registryJSON = "http://localhost:3000/r/drizzle-pg.json";

export async function addDrizzlePostgres(databaseId: string) {
	execSync(`npx shadcn@latest add ${registryJSON}`, { stdio: "inherit" });

	addPostgresWorkload(databaseId);

	await addDefaultImports(databaseId, {
		rootConfigFile: "drizzle.config.ts",
		clientFile: "lib/drizzle/drizzle.ts",
	});

	await addEnvVar(
		new PostgresDatabase(databaseId).connectionStringEnvVar,
		`postgresql://postgres:postgres@localhost:5432/${databaseId}`,
	);
	await addScriptToPackageJson("db:generate", "drizzle-kit generate");
	await addScriptToPackageJson("db:migrate", "npx tsx lib/drizzle/migrate.ts");
	await addScriptToPackageJson("db:seed", "npx tsx lib/drizzle/seed.ts");
	await addScriptToPackageJson("db:studio", "drizzle-kit studio");
}
