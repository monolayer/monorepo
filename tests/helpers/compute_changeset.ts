import { Kysely } from "kysely";
import { ActionStatus } from "~/cli/command.js";
import { changeset } from "~/database/changeset.js";
import { localSchema } from "~/database/introspection/local_schema.js";
import { remoteSchema } from "~/database/introspection/remote_schema.js";
import { type AnyPgDatabase } from "~/database/schema/pg_database.js";

export async function computeChangeset(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	kysely: Kysely<any>,
	db: AnyPgDatabase,
) {
	const remote = await remoteSchema(kysely);
	if (remote.status === ActionStatus.Error) {
		throw remote.error;
	}
	const local = localSchema(db, remote.result);
	return changeset(local, remote.result);
}
