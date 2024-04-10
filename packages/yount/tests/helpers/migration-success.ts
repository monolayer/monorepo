import type { MigrationResultSet, Migrator } from "kysely";
import path from "path";
import { expect } from "vitest";
import type { Changeset } from "~/changeset/types.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { generateMigrationFiles } from "~/migrations/generate.js";
import type { AnyPgDatabase } from "~/schema/pg-database.js";
import type { DbContext } from "~tests/setup/kysely.js";
import { computeChangeset } from "./compute-changeset.js";

async function migrateUp(
	folder: string,
	migrator: Migrator,
	changeset: Changeset[],
) {
	generateMigrationFiles(
		changeset,
		path.join(folder, "migrations"),
		undefined,
		false,
	);
	return await migrator.migrateToLatest();
}

async function migrateDown(migrator: Migrator) {
	return await migrator.migrateDown();
}

function expectMigrationSuccess(resultSet: MigrationResultSet) {
	if (resultSet.error) {
		console.dir(resultSet.error);
	}
	expect(resultSet.error, resultSet.error as string).toBeUndefined();
	if (resultSet.results === undefined) {
		throw new Error("results is undefined");
	}
	for (const result of resultSet.results) {
		expect(result.status).toBe("Success");
	}
}

export async function testUpAndDownMigrations(
	context: DbContext,
	database: AnyPgDatabase,
	cs: Changeset[],
	down: "same" | "reverse" | "empty",
	camelCase: CamelCaseOptions = { enabled: false },
) {
	expectMigrationSuccess(await migrateUp(context.folder, context.migrator, cs));

	const afterUpCs = await computeChangeset(context.kysely, database, camelCase);
	expect(afterUpCs).toEqual([]);

	expectMigrationSuccess(await migrateDown(context.migrator));
	switch (down) {
		case "reverse": {
			const afterDownCs = await computeChangeset(
				context.kysely,
				database,
				camelCase,
			);
			expect(afterDownCs).toEqual(
				cs.reverse().filter((changeset) => changeset.type !== "createSchema"),
			);
			break;
		}
		case "same": {
			const afterDownCs = await computeChangeset(
				context.kysely,
				database,
				camelCase,
			);
			expect(afterDownCs).toEqual(cs);
			break;
		}
		case "empty": {
			const afterDownCs = await computeChangeset(
				context.kysely,
				database,
				camelCase,
			);
			expect(afterDownCs).toEqual([]);
			break;
		}
	}
}

export async function testChangesetAndMigrations({
	context,
	database,
	expected,
	down,
	useCamelCase = { enabled: false },
}: {
	context: DbContext;
	database: AnyPgDatabase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expected: any[];
	down: "same" | "reverse" | "empty";
	useCamelCase?: CamelCaseOptions;
}) {
	const camelCase = useCamelCase ?? false;
	const cs = await computeChangeset(context.kysely, database, camelCase);
	expect(cs).toEqual(expected);

	await testUpAndDownMigrations(context, database, cs, down, camelCase);
}
