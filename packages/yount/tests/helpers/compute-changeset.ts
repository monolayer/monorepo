import { Effect } from "effect";
import { Kysely } from "kysely";
import { changeset } from "~/changeset/changeset.js";
import { schemaChangeset } from "~/cli/programs/schema-changeset.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { localSchema, remoteSchema } from "~/introspection/introspection.js";
import { createSchemaChangeset } from "~/schema/database_schemas/changeset.js";
import { schemaInDb } from "~/schema/database_schemas/introspection.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg-database.js";
import { layers } from "./layers.js";
import { programWithErrorCause } from "./run-program.js";

export async function computeChangeset(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	db: AnyPgDatabase,
	camelCase?: CamelCaseOptions,
) {
	const schemaName = PgDatabase.info(db).schema || "public";
	const remote = await remoteSchema(kysely, schemaName);
	const local = localSchema(db, remote, camelCase ?? { enabled: false });
	const cset = changeset(local, remote, schemaName);
	const schemaInDatabase = await schemaInDb(kysely, schemaName);
	if (schemaInDatabase.length === 0) {
		cset.unshift(createSchemaChangeset(schemaName));
	}
	return cset;
}

export async function computeChangeset2() {
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(schemaChangeset()), layers),
	);
}
