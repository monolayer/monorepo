import * as p from "@clack/prompts";
import { Effect } from "effect";
import { TaggedClass } from "effect/Data";
import { sql } from "kysely";
import path from "path";
import { exit } from "process";
import { type SeedImport } from "~/config.js";
import { dbTableInfo } from "~/database/schema/table/introspection.js";
import { localPendingSchemaMigrations } from "~/migrations/pending.js";
import { changeset } from "../changeset/changeset.js";
import { checkWithFail } from "../cli/check-with-fail.js";
import { spinnerTask } from "../cli/spinner-task.js";
import { DbClients } from "../services/db-clients.js";
import { Environment } from "../services/environment.js";

type SeedOptions = {
	disableWarnings?: boolean;
	replant?: boolean;
	seedFile?: string;
};

export function seed({
	disableWarnings,
	replant,
	seedFile = "seed.ts",
}: SeedOptions) {
	return Effect.succeed(true)
		.pipe(
			Effect.map(() => {
				p.log.message(
					`${replant ? "Truncate tables and seed database" : "Seed Database"}`,
				);
			}),
			Effect.tap(() => checkPendingMigrations()),
			Effect.tap(() => checkPendingSchemaChanges()),
			Effect.tap(() => checkSeederFunction(seedFile)),
			Effect.tap(() =>
				Effect.if(!!replant && !disableWarnings, {
					onTrue: () => replantWarning(),
					onFalse: () => Effect.void,
				}),
			),
		)
		.pipe(
			Effect.tap(() =>
				Effect.if(!!replant, {
					onTrue: () => truncateAllTables(),
					onFalse: () => Effect.void,
				}),
			),
			Effect.tap(() => seedDatabase(seedFile)),
		);
}

function checkPendingMigrations() {
	return checkWithFail({
		name: "Check pending migrations",
		nextSteps: `1) Run 'npx monolayer migrate' to migrate the database.
2) Run again \`npx monolayer seed\`.`,
		errorMessage:
			"You have pending schema migrations. Cannot seed until they are run.",
		failMessage: "Pending schema migrations",
		callback: () =>
			Effect.succeed(true).pipe(
				Effect.flatMap(localPendingSchemaMigrations),
				Effect.flatMap((result) => Effect.succeed(result.length === 0)),
			),
	});
}

function checkPendingSchemaChanges() {
	return checkWithFail({
		name: "Check pending schema changes",
		nextSteps: `1) Run 'npx monolayer generate' to generate migrations.
2) Run 'npx monolayer migrate' to migrate the database.
3) Run again \`npx monolayer seed\`.`,
		errorMessage:
			"The local schema does not match the database schema. Cannot continue.",
		failMessage: "Pending Schema Changes",
		callback: () =>
			Effect.succeed(true).pipe(
				Effect.flatMap(changeset),
				Effect.flatMap((result) => Effect.succeed(result.length === 0)),
			),
	});
}

function checkSeederFunction(seedFile: string) {
	return checkWithFail({
		name: "Check seeder function",
		nextSteps: `1) Check that a seeder function is exported in your seeder.ts file.
2) Run 'npx create-monolayer' and choose your current database folder to regenerate the seeder file.`,
		errorMessage: "No seeder function found. Cannot continue.",
		failMessage: "Seeder function missing",
		callback: () =>
			Effect.succeed(true).pipe(
				Effect.flatMap(() =>
					importSeedFunction(seedFile).pipe(
						Effect.catchTags({
							UndefinedSeedFunction: () => Effect.succeed(undefined),
						}),
					),
				),
				Effect.flatMap((result) => Effect.succeed(result !== undefined)),
			),
	});
}

function replantWarning() {
	return Effect.tryPromise(async () => {
		const shouldContinue = await p.confirm({
			initialValue: false,
			message: `Seeding with replant is a destructive operation. All tables in the database will be truncated. Do you want to proceed?`,
		});
		if (shouldContinue !== true) {
			p.cancel("Operation cancelled.");
			exit(1);
		}
	});
}

function truncateAllTables() {
	return DbClients.pipe(
		Effect.flatMap((dbClients) =>
			Effect.tryPromise(() =>
				dbTableInfo(dbClients.currentEnvironment.kysely, "public"),
			).pipe(
				Effect.tap((result) =>
					Effect.forEach(result, (table) =>
						Effect.tryPromise(async () => {
							await sql`truncate table ${sql.table(
								`${table.name}`,
							)} RESTART IDENTITY CASCADE`.execute(
								dbClients.currentEnvironment.kysely,
							);
							p.log.info(`Truncated ${table.name}.`);
						}),
					),
				),
			),
		),
	);
}

export class UndefinedSeedFunction extends TaggedClass(
	"UndefinedSeedFunction",
) {}

export function importSeedFunction(seedFile: string) {
	return Environment.pipe(
		Effect.flatMap((environment) =>
			Effect.tryPromise(async () => {
				try {
					const moduleImport: SeedImport = await import(
						path.join(process.cwd(), environment.folder, seedFile)
					);
					if (moduleImport.seed !== undefined) {
						return moduleImport.seed;
					}
				} catch (error) {
					return undefined;
				}
			}),
		),
		Effect.flatMap((seedFn) =>
			Effect.if(seedFn !== undefined, {
				onTrue: () => Effect.succeed(seedFn!),
				onFalse: () => Effect.fail(new UndefinedSeedFunction()),
			}),
		),
	);
}

function seedDatabase(seedFile: string) {
	return DbClients.pipe(
		Effect.flatMap((dbClient) =>
			spinnerTask(`Seed ${dbClient.currentEnvironment.databaseName}`, () =>
				importSeedFunction(seedFile).pipe(
					Effect.flatMap((seedImport) =>
						Effect.tryPromise(() =>
							seedImport(dbClient.currentEnvironment.kysely),
						),
					),
				),
			),
		),
	);
}
