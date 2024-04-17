import { Kysely } from "kysely";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { createSchemaChangeset } from "~/database/database_schemas/changeset.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
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
	);
	const cset = schemaChangeset(
		local,
		remote,
		schemaName,
		camelCase ?? { enabled: false },
		[],
		{},
	);
	const schemaInDatabase = await schemaInDb(kysely, schemaName);
	if (schemaInDatabase.length === 0) {
		cset.unshift(createSchemaChangeset(schemaName));
	}
	return cset;
}
