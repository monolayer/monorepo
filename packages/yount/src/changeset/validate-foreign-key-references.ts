import { Effect } from "effect";
import type { AnySchema } from "~/database/schema/schema.js";
import {
	foreignKeyOptions,
	type AnyPgForeignKey,
} from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import type { AnyPgTable } from "~/database/schema/table/table.js";
import { tableInfo } from "~/introspection/helpers.js";
import { findTable } from "~/introspection/schema.js";

export function validateForeignKeyReferences(schema: AnySchema) {
	return Effect.gen(function* (_) {
		for (const [tableName, table] of Object.entries(schema.tables)) {
			const foreignKeys = tableInfo(table).schema.constraints?.foreignKeys;
			if (foreignKeys === undefined) {
				continue;
			}
			for (const foreignKey of foreignKeys as AnyPgForeignKey[]) {
				const targetTable = foreignKeyOptions(foreignKey).targetTable;
				if (findTable(targetTable as AnyPgTable, schema) === undefined) {
					return yield* _(
						Effect.fail(new ForeignKeyReferencedTableMissing(tableName)),
					);
				}
			}
		}
		return yield* _(Effect.succeed(true));
	});
}

export class ForeignKeyReferencedTableMissing extends TypeError {
	constructor(tableName: string) {
		super(
			`Foreign key in table ${tableName} references a table that is not in the schema`,
		);
	}
}
