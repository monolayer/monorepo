import * as p from "@clack/prompts";
import { CamelCasePlugin, Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import color from "picocolors";
import { exit } from "process";
import { changeset } from "~/changeset/changeset.js";
import { importConfig, importSchema, importSeedFunction } from "~/config.js";
import { localSchema, remoteSchema } from "~/introspection/introspection.js";
import { fetchPendingMigrations } from "~/migrations/info.js";
import { dbTableInfo } from "~/schema/table/introspection.js";
import { ActionStatus } from "../command.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function seed(options: {
	environment?: string;
	disableWarnings?: true;
	replant?: true;
}) {
	p.intro(`${options.replant ? "Truncate and " : ""}Seed Database`);
	const config = await importConfig();

	const environmentConfig = checkEnvironmentIsConfigured(
		config,
		options.environment || "development",
		{
			outro: true,
		},
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const db = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
		plugins: config.camelCasePlugin?.enabled ? [new CamelCasePlugin()] : [],
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dbWithoutPlugins = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
	});

	const pending = await fetchPendingMigrations(config, dbWithoutPlugins);

	if (pending.length > 0) {
		p.log.error("You have pending migrations. Cannot seed until they are run.");
		const nextSteps = `1) Run 'npx yount migrate' to migrate the database.
2) Run again \`npx yount seed\`.`;
		p.note(nextSteps, "Next Steps");
		p.outro(`${color.red("Failed")}`);
		db.destroy();
		exit(1);
	}

	const remote = await remoteSchema(dbWithoutPlugins);
	if (remote.status === ActionStatus.Error) {
		p.log.error("Error while fetching database information");
		console.error(remote.error);
		dbWithoutPlugins.destroy();
		exit(1);
	}

	dbWithoutPlugins.destroy();

	const schema = await importSchema();
	if (schema.database === undefined) {
		p.log.error(`No database schema exported at ${config.folder}/schema.ts.`);
		exit(1);
	}

	const local = localSchema(
		schema.database,
		remote.result,
		config.camelCasePlugin,
	);

	const cs = changeset(local, remote.result);

	if (cs.length > 0) {
		p.log.error(
			"The local schema does not match the database schema. Cannot continue.",
		);
		const nextSteps = `1) Run 'npx yount generate' to generate migrations.
2) Run 'npx yount migrate' to migrate the database.
3) Run again \`npx yount seed\`.`;
		p.note(nextSteps, "Next Steps");
		p.outro(`${color.red("Failed")}`);
		db.destroy();
		exit(1);
	}

	if (options.replant) {
		await truncateAllTables(
			db,
			environmentConfig.database || "",
			options.disableWarnings ?? false,
		);
	}

	await seedDb(db, environmentConfig.database || "");

	db.destroy();
	p.outro("Done");
}

async function truncateAllTables(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: Kysely<any>,
	database: string,
	disableWarnings: boolean,
) {
	if (!disableWarnings) {
		const shouldContinue = await p.confirm({
			message: `This is a destructive operation. All tables in the ${database} will be truncated. Do you want to proceed?`,
		});

		if (!shouldContinue) {
			p.cancel("Operation cancelled.");
			db.destroy();
			exit(1);
		}
	}
	const result = await dbTableInfo(db, "public");

	for (const table of result) {
		await sql`truncate table ${sql.table(
			`${table.name}`,
		)} RESTART IDENTITY CASCADE`.execute(db);
		p.log.info(`Truncated ${table.name}.`);
	}
}

async function seedDb(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: Kysely<any>,
	database: string,
) {
	const seeder = await importSeedFunction();

	if (seeder.seed === undefined) {
		p.log.error("No seeder function found.");
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}

	try {
		const s = p.spinner();
		s.start(`Seeding ${database}`);
		await seeder.seed(db);
		s.stop(`${database} sucessfully seeded.`, 0);
	} catch (error) {
		p.log.error("Error while seeding.");
		console.error(error);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}
}
