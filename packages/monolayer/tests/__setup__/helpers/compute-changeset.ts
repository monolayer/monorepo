import { Kysely } from "kysely";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	introspectLocalSchema,
	introspectRemoteSchema,
} from "~/introspection/introspection.js";

export async function computeChangeset(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	db: AnySchema,
	camelCase?: CamelCaseOptions,
) {
	const schemaName = Schema.info(db).name || "public";
	const remote = await introspectRemoteSchema(kysely, schemaName);
	const local = introspectLocalSchema(
		db,
		remote,
		camelCase ?? { enabled: false },
		[],
		{},
		schemaName,
		[db],
	);
	const cset = schemaChangeset(
		local,
		remote,
		schemaName,
		camelCase ?? { enabled: false },
		[],
		{},
		[],
	);
	return cset;
}
