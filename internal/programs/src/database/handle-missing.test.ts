import { Effect } from "effect";
import { expect, test } from "vitest";
import { databaseName } from "~programs/database/database-name.js";
import { handleMissingDatabase } from "~programs/database/handle-missing.js";
import { createTestDatabase } from "~test-setup/database.js";
import { pressKey } from "~test-setup/keys.js";
import { pgAdminPool } from "~test-setup/pool.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

test<TestProgramContext>("databaseName should return the current environment database name", async (context) => {
	expect(await Effect.runPromise(runProgram(databaseName, context))).toBe(
		"9ee562df",
	);
});

test<TestProgramContext>("handleMissingDatabase when database exists returns 'exists'", async (context) => {
	await createTestDatabase(context);
	expect(
		await Effect.runPromise(runProgram(handleMissingDatabase, context)),
	).toBe("exists");
});

test<TestProgramContext>("user selects not to create the database", async (context) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let error: any;
	try {
		const program = Effect.runPromise(
			runProgram(
				handleMissingDatabase.pipe(
					Effect.tapErrorCause((cause) => {
						error = cause;
						return Effect.void;
					}),
				),
				context,
			),
		);

		await pressKey("ENTER");

		await program;
	} catch {
		/* empty */
	}
	expect(error._tag).toBe("Die");

	// Gitub Actions terminal output will not match the following snapshot
	if (process.env.CI) return;

	expect(context.logMessages).toMatchInlineSnapshot(`
		[
		  "│
		▲  The database 'af1df790' does not exist.
		",
		  "[?25l",
		  "│
		◆  Do you want to create it?
		│  ○ Yes / ● No
		└
		",
		  "[999D[4A",
		  "[1B",
		  "[J",
		  "◇  Do you want to create it?
		│  No",
		  "
		",
		  "[?25h",
		  "└  Operation cancelled.

		",
		]
	`);
});

test<TestProgramContext>("user cancels prompt", async (context) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let error: any;
	try {
		const program = Effect.runPromise(
			runProgram(
				handleMissingDatabase.pipe(
					Effect.tapErrorCause((cause) => {
						error = cause;
						return Effect.void;
					}),
				),
				context,
			),
		);

		await pressKey("CONTROLC");

		await program;
	} catch {
		/* empty */
	}
	expect(error._tag).toBe("Die");

	// Gitub Actions terminal output will not match the following snapshot
	if (process.env.CI) return;

	expect(context.logMessages).toMatchInlineSnapshot(`
		[
		  "│
		▲  The database '9d5f3201' does not exist.
		",
		  "[?25l",
		  "│
		◆  Do you want to create it?
		│  ○ Yes / ● No
		└
		",
		  "[999D[4A",
		  "[1B",
		  "[J",
		  "■  Do you want to create it?
		│  No
		│",
		  "
		",
		  "[?25h",
		  "└  Operation cancelled.

		",
		]
	`);
});

test<TestProgramContext>(
	"user selects to create the database",
	{ retry: 6 },
	async (context) => {
		expect(
			await databaseExists({ databaseName: context.databaseName }),
		).toStrictEqual([]);
		const program = Effect.runPromise(
			runProgram(handleMissingDatabase, context),
		);

		await pressKey("UP");
		await pressKey("ENTER");

		const result = await program;
		expect(result).toBe("created");
		expect(
			await databaseExists({ databaseName: context.databaseName }),
		).toStrictEqual([{ exists: true }]);
	},
);

async function databaseExists({ databaseName }: { databaseName: string }) {
	const pool = pgAdminPool();
	const query = `SELECT true as exists FROM pg_database WHERE datname = '${databaseName}'`;
	return (await pool.query<{ exists: boolean }>(query)).rows;
}
