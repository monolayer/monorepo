// import * as p from "@clack/prompts";
// import { ActionError, type ActionErrors } from "@monorepo/base/errors.js";
// import { checkWithFail } from "@monorepo/cli/check.js";
// import { spinnerTask } from "@monorepo/cli/spinner-task.js";
// import type { InformationSchemaDB } from "@monorepo/pg/introspection/introspection/types.js";
// import { dbTableInfo } from "@monorepo/pg/introspection/table-two.js";
// import { DbClients } from "@monorepo/services/db-clients.js";
// import type { ProgramContext } from "@monorepo/services/program-context.js";
// import { appEnvironment } from "@monorepo/state/app-environment.js";
// import { type SeedImport } from "@monorepo/state/import-config.js";
// import { Effect } from "effect";
// import { sql, type Kysely } from "kysely";
// import path from "path";
// import { exit } from "process";
// import { changeset } from "../../changeset/changeset.js";
// import { localPendingSchemaMigrations } from "../migrations/pending.js";

// type SeedOptions = {
// 	disableWarnings?: boolean;
// 	replant?: boolean;
// 	seedFile?: string;
// };

// export function seed({
// 	disableWarnings,
// 	replant,
// 	seedFile = "seed.ts",
// }: SeedOptions) {
// 	return Effect.gen(function* () {
// 		p.log.message(
// 			`${replant ? "Truncate tables and seed database" : "Seed Database"}`,
// 		);
// 		yield* checkPendingMigrations;
// 		yield* checkPendingSchemaChanges;
// 		yield* checkSeederFunction(seedFile);

// 		if (!!replant && !disableWarnings) yield* replantWarning;
// 		if (replant) yield* truncateAllTables;

// 		yield* seedDatabase(seedFile);
// 	});
// }

// const checkPendingMigrations = checkWithFail<ActionErrors, ProgramContext>({
// 	name: "Check pending migrations",
// 	nextSteps: `1) Run 'npx monolayer migrate' to migrate the database.
// 2) Run again \`npx monolayer seed\`.`,
// 	errorMessage:
// 		"You have pending schema migrations. Cannot seed until they are run.",
// 	failMessage: "Pending schema migrations",
// 	callback: () =>
// 		Effect.gen(function* () {
// 			return (yield* localPendingSchemaMigrations).length === 0;
// 		}),
// });

// const checkPendingSchemaChanges = checkWithFail({
// 	name: "Check pending schema changes",
// 	nextSteps: `1) Run 'npx monolayer generate' to generate migrations.
// 2) Run 'npx monolayer migrate' to migrate the database.
// 3) Run again \`npx monolayer seed\`.`,
// 	errorMessage:
// 		"The local schema does not match the database schema. Cannot continue.",
// 	failMessage: "Pending Schema Changes",
// 	callback: () =>
// 		changeset().pipe(
// 			Effect.flatMap((result) => Effect.succeed(result.length === 0)),
// 		),
// });

// function checkSeederFunction(seedFile: string) {
// 	return checkWithFail({
// 		name: "Check seeder function",
// 		nextSteps: `1) Check that a seeder function is exported in your seeder.ts file.
// 2) Run 'npx create-monolayer' and choose your current database folder to regenerate the seeder file.`,
// 		errorMessage: "No seeder function found. Cannot continue.",
// 		failMessage: "Seeder function missing",
// 		callback: () =>
// 			Effect.succeed(true).pipe(
// 				Effect.flatMap(() => importSeedFunction(seedFile)),
// 				Effect.flatMap((result) => Effect.succeed(result !== undefined)),
// 			),
// 	});
// }

// const replantWarning = Effect.tryPromise(async () => {
// 	const shouldContinue = await p.confirm({
// 		initialValue: false,
// 		message: `Seeding with replant is a destructive operation. All tables in the database will be truncated. Do you want to proceed?`,
// 	});
// 	if (shouldContinue !== true) {
// 		p.cancel("Operation cancelled.");
// 		exit(1);
// 	}
// });

// const truncateAllTables = Effect.gen(function* () {
// 	const dbClients = yield* DbClients;
// 	const tableInfo = yield* Effect.tryPromise(() =>
// 		dbTableInfo(dbClients.kysely as Kysely<InformationSchemaDB>, "public"),
// 	);
// 	for (const table of tableInfo) {
// 		yield* Effect.tryPromise(() =>
// 			sql`truncate table ${sql.table(
// 				`${table.name}`,
// 			)} RESTART IDENTITY CASCADE`.execute(dbClients.kysely),
// 		);
// 		p.log.info(`Truncated ${table.name}.`);
// 	}
// });

// function importSeedFunction(seedFile: string) {
// 	return Effect.gen(function* () {
// 		const environment = yield* appEnvironment;
// 		const seedFn = yield* Effect.tryPromise(async () => {
// 			const mod: SeedImport = await import(
// 				path.join(process.cwd(), environment.folder, seedFile)
// 			);
// 			return mod.seed;
// 		});
// 		if (seedFn === undefined) {
// 			return yield* Effect.fail(
// 				new ActionError(
// 					"Missing seed function",
// 					`Could not find a seed function in ${seedFile}.`,
// 				),
// 			);
// 		} else {
// 			return seedFn;
// 		}
// 	});
// }

// function seedDatabase(seedFile: string) {
// 	return Effect.gen(function* () {
// 		const dbClients = yield* DbClients;
// 		const databaseName = dbClients.databaseName;
// 		const kysely = dbClients.kysely;

// 		return yield* spinnerTask(`Seed ${databaseName}`, () =>
// 			Effect.gen(function* () {
// 				const seedFn = yield* importSeedFunction(seedFile);
// 				yield* Effect.tryPromise(() => seedFn(kysely));
// 			}),
// 		);
// 	});
// }
