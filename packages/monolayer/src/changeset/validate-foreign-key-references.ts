import { Effect } from "effect";
import { findTableInSchema } from "~/database/schema/introspect-table.js";
import type { AnySchema } from "~/database/schema/schema.js";
import {
	PgSelfReferentialForeignKey,
	foreignKeyOptions,
	type AnyPgForeignKey,
} from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
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
				if (
					findTableInSchema(foreignKeyTargetTable, allSchemas) === undefined
				) {
					return yield* Effect.fail(
						new ForeignKeyReferencedTableMissing(tableName),
					);
				}
			}
		}
		return yield* Effect.succeed(true);
	});
}

export class ForeignKeyReferencedTableMissing extends TypeError {
	constructor(tableName: string) {
		super(
			`Foreign key in table ${tableName} references a table that is not in the schema`,
		);
	}
}
