import { ActionError } from "@monorepo/cli/errors.js";
import {
	findTableInSchema,
	tableInfo,
} from "@monorepo/pg/introspection/table.js";
import {
	PgSelfReferentialForeignKey,
	foreignKeyOptions,
	type AnyPgForeignKey,
} from "@monorepo/pg/schema/foreign-key.js";
import type { AnySchema } from "@monorepo/pg/schema/schema.js";
import { PgTable } from "@monorepo/pg/schema/table.js";
import { Effect } from "effect";

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
