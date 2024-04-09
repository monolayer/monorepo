import { Effect } from "effect";
import { Kysely } from "kysely";
import { changeset } from "~/changeset/changeset.js";
import { schemaChangeset } from "~/cli/programs/schema-changeset.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { localSchema, remoteSchema } from "~/introspection/introspection.js";
import type { AnyPgDatabase } from "~/schema/pg-database.js";
import { layers } from "./layers.js";
import { programWithErrorCause } from "./run-program.js";

export async function computeChangeset(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	db: AnyPgDatabase,
	camelCase?: CamelCaseOptions,
) {
	const remote = await remoteSchema(kysely);
	const local = localSchema(db, remote, camelCase ?? { enabled: false });
	return changeset(local, remote);
}

export async function computeChangeset2() {
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(schemaChangeset()), layers),
	);
}
