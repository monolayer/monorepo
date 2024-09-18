import * as p from "@clack/prompts";
import { checkWithFail } from "@monorepo/cli/check.js";
import { ActionError, type ActionErrors } from "@monorepo/cli/errors.js";
import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import type { InformationSchemaDB } from "@monorepo/pg/introspection/introspection/types.js";
import { dbTableInfo } from "@monorepo/pg/introspection/table-two.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import type { ProgramContext } from "@monorepo/services/program-context.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { fail, gen, tryPromise } from "effect/Effect";
import { sql, type Kysely } from "kysely";
import { exit } from "node:process";
import { computeChangeset } from "~programs/changeset.js";
import { pendingMigrations } from "~programs/migrations/pending.js";

export const seedDatabase = gen(function* () {
	const database = (yield* appEnvironment).currentDatabase;
	const dbClients = yield* DbClients;
	const databaseName = dbClients.databaseName;
	const kysely = dbClients.kysely;
	const seedFn = database.seeder;
	if (seedFn === undefined) {
		yield* fail(
			new ActionError(
				"Missing seeder",
				`${database.id} has no seeder function.`,
			),
		);
	} else {
		return yield* spinnerTask(`Seed ${databaseName}`, () =>
			gen(function* () {
				yield* tryPromise(() => seedFn(kysely));
			}),
		);
	}
});

export const checkPendingMigrations = checkWithFail<
	ActionErrors,
	ProgramContext
>({
	name: "Check pending migrations",
	nextSteps: `1) Run 'npx monolayer migrate' to migrate the database.
2) Run again \`npx monolayer seed\`.`,
	errorMessage:
		"You have pending schema migrations. Cannot seed until they are run.",
	failMessage: "Pending schema migrations",
	callback: () =>
		gen(function* () {
			return (yield* pendingMigrations).length === 0;
		}),
});

export const checkPendingSchemaChanges = checkWithFail({
	name: "Check pending schema changes",
	nextSteps: `1) Run 'npx monolayer generate' to generate migrations.
2) Run 'npx monolayer migrate' to migrate the database.
3) Run again \`npx monolayer seed\`.`,
	errorMessage:
		"The local schema does not match the database schema. Cannot continue.",
	failMessage: "Pending Schema Changes",
	callback: () =>
		computeChangeset.pipe(
			Effect.flatMap((result) => Effect.succeed(result.length === 0)),
		),
});

export const replantWarning = Effect.tryPromise(async () => {
	const shouldContinue = await p.confirm({
		initialValue: false,
		message: `Seeding with replant is a destructive operation. All tables in the database will be truncated. Do you want to proceed?`,
	});
	if (shouldContinue !== true) {
		p.cancel("Operation cancelled.");
		exit(1);
	}
});

export const truncateAllTables = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	const tableInfo = yield* Effect.tryPromise(() =>
		dbTableInfo(dbClients.kysely as Kysely<InformationSchemaDB>, "public"),
	);
	for (const table of tableInfo) {
		yield* Effect.tryPromise(() =>
			sql`truncate table ${sql.table(
				`${table.name}`,
			)} RESTART IDENTITY CASCADE`.execute(dbClients.kysely),
		);
		p.log.info(`Truncated ${table.name}.`);
	}
});
