import { Kysely } from "kysely";
import { changeset } from "~/changeset/changeset.js";
import { ActionStatus } from "~/cli/command.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { localSchema, remoteSchema } from "~/introspection/introspection.js";
import type { AnyPgDatabase } from "~/schema/pg-database.js";

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
