import { Kysely } from "kysely";
import { ActionStatus } from "~/cli/command.js";
import { changeset } from "~/database/changeset.js";
import { localSchema } from "~/database/introspection/local_schema.js";
import { remoteSchema } from "~/database/introspection/remote_schema.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { type PgTable } from "~/database/schema/pg_table.js";

export async function computeChangeset(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	kysely: Kysely<any>,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	db: pgDatabase<Record<string, PgTable<string, any, any>>>,
) {
	const remote = await remoteSchema(kysely);
	if (remote.status === ActionStatus.Error) {
		throw remote.error;
	}
	const local = localSchema(db, remote.result);
	return changeset(local, remote.result);
}
