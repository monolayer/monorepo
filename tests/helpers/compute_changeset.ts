import { Kysely } from "kysely";
import { ActionStatus } from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
import { changeset } from "~/database/changeset.js";
import { localSchema, remoteSchema } from "~/database/introspection/schemas.js";
import { type AnyPgDatabase } from "~/database/schema/pg_database.js";

export async function computeChangeset(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	db: AnyPgDatabase,
	camelCase?: CamelCaseOptions,
) {
	const remote = await remoteSchema(kysely);
	if (remote.status === ActionStatus.Error) {
		throw remote.error;
	}
	const local = localSchema(db, remote.result, camelCase ?? { enabled: false });
	return changeset(local, remote.result);
}
