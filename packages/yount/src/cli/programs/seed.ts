import * as p from "@clack/prompts";
import { Effect } from "effect";
import { TaggedClass } from "effect/Data";
import { sql } from "kysely";
import path from "path";
import { exit } from "process";
import { type SeedImport } from "~/config.js";
import { dbTableInfo } from "~/schema/table/introspection.js";
import { Environment } from "../services/environment.js";
import { Db } from "../services/kysely.js";
import { checkWithFail } from "../utils/check-with-fail.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { localPendingMigrations } from "./local-pending-migrations.js";
import { schemaChangeset } from "./schema-changeset.js";

export function seed(options: {
	disableWarnings?: boolean;
	replant?: boolean;
}) {
	return Effect.succeed(true)
		.pipe(
			Effect.map(() => {
				p.log.message(
					`${options.replant ? "Truncate tables and seed database" : "Seed Database"}`,
				);
			}),
			Effect.tap(() => checkPendingMigrations()),
			Effect.tap(() => checkPendingSchemaChanges()),
			Effect.tap(() => checkSeederFunction()),
			Effect.tap(() =>
				Effect.if(!!options.replant && !options.disableWarnings, {
					onTrue: replantWarning(),
					onFalse: Effect.unit,
				}),
			),
		)
		.pipe(
			Effect.tap(() =>
				Effect.if(!!options.replant, {
					onTrue: truncateAllTables(),
					onFalse: Effect.unit,
				}),
			),
			Effect.tap(() => seedDatabase()),
		);
}

function checkPendingMigrations() {
	return checkWithFail({
		name: "Check pending migrations",
		nextSteps: `1) Run 'npx yount migrate' to migrate the database.
2) Run again \`npx yount seed\`.`,
		errorMessage:
			"You have pending migrations. Cannot seed until they are run.",
		failMessage: "Pending Migrations",
		callback: () =>
			Effect.succeed(true).pipe(
				Effect.flatMap(localPendingMigrations),
				Effect.flatMap((result) => Effect.succeed(result.length === 0)),
			),
	});
}

function checkPendingSchemaChanges() {
	return checkWithFail({
		name: "Check pending schema changes",
		nextSteps: `1) Run 'npx yount generate' to generate migrations.
2) Run 'npx yount migrate' to migrate the database.
3) Run again \`npx yount seed\`.`,
		errorMessage:
			"The local schema does not match the database schema. Cannot continue.",
		failMessage: "Pending Schema Changes",
		callback: () =>
			Effect.succeed(true).pipe(
				Effect.flatMap(schemaChangeset),
				Effect.flatMap((result) => Effect.succeed(result.length === 0)),
			),
	});
}

function checkSeederFunction() {
	return checkWithFail({
		name: "Check seeder function",
		nextSteps: `1) Check that a seeder function is exported in your seeder.ts file.
2) Run 'npx init-yount' and choose your current yount folder to regenerate the seeder file.`,
		errorMessage: "No seeder function found. Cannot continue.",
		failMessage: "Seeder function missing",
		callback: () =>
			Effect.succeed(true).pipe(
				Effect.flatMap(() =>
					importSeedFunction().pipe(
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
	return Db.pipe(
		Effect.flatMap((db) =>
			Effect.tryPromise(() => dbTableInfo(db.kysely, "public")).pipe(
				Effect.tap((result) =>
					Effect.forEach(result, (table) =>
						Effect.tryPromise(async () => {
							await sql`truncate table ${sql.table(
								`${table.name}`,
							)} RESTART IDENTITY CASCADE`.execute(db.kysely);
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

export function importSeedFunction() {
	return Environment.pipe(
		Effect.flatMap((environment) =>
			Effect.tryPromise(async () => {
				try {
					const moduleImport: SeedImport = await import(
						path.join(process.cwd(), environment.config.folder, "seed.ts")
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
				onTrue: Effect.succeed(seedFn!),
				onFalse: Effect.fail(new UndefinedSeedFunction()),
			}),
		),
	);
}

function seedDatabase() {
	return Effect.all([Environment, Db]).pipe(
		Effect.flatMap(([environment, db]) =>
			spinnerTask(`Seed ${environment.pg.config.database}`, () =>
				importSeedFunction().pipe(
					Effect.flatMap((seedImport) =>
						Effect.tryPromise(() => seedImport(db.kysely)),
					),
				),
			),
		),
	);
}
