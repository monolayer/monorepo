import { Effect } from "effect";
import { ActionError } from "~/cli/errors.js";
import { findTableInSchema } from "~/database/schema/introspect-table.js";
import type { AnySchema } from "~/database/schema/schema.js";
import {
	PgSelfReferentialForeignKey,
	foreignKeyOptions,
	type AnyPgForeignKey,
} from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { PgTable } from "~/database/schema/table/table.js";
import { tableInfo } from "~/introspection/helpers.js";

export function validateForeignKeyReferences(
	schema: AnySchema,
	allSchemas: AnySchema[],
) {
	return Effect.gen(function* () {
		for (const [tableName, table] of Object.entries(schema.tables)) {
			const foreignKeys = tableInfo(table).definition.constraints?.foreignKeys;
			if (foreignKeys === undefined) {
				continue;
			}
			for (const foreignKey of foreignKeys as AnyPgForeignKey[]) {
				if (foreignKey instanceof PgSelfReferentialForeignKey) {
					continue;
				}
				const foreignKeyTargetTable = foreignKeyOptions(foreignKey).targetTable;
				if (foreignKeyTargetTable instanceof PgTable) {
					if (
						findTableInSchema(foreignKeyTargetTable, allSchemas) === undefined
					) {
						return yield* Effect.fail(
							new ActionError(
								"Missing foreign key",
								`Foreign key in table ${tableName} references a table that is not in the schema`,
							),
						);
					}
				}
			}
		}
		return yield* Effect.succeed(true);
	});
}
