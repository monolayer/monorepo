import { type Kysely, sql } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { UniqueInfo } from "~/database/migrations/migration_schema.js";
import { uniqueConstraintInfoToQuery } from "../info_to_query.js";
import type { InformationSchemaDB } from "./types.js";

export type UniqueConstraintInfo = {
	constraintType: "UNIQUE";
	table: string | null;
	columns: string[];
	nullsDistinct: boolean;
};

export async function dbUniqueConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<UniqueInfo> | OperationAnyError> {
	try {
		if (tableNames.length === 0) {
			return {
				status: ActionStatus.Success,
				result: {},
			};
		}
		const results = await kysely
			.selectFrom("pg_constraint")
			.fullJoin("pg_namespace", (join) =>
				join.onRef("pg_namespace.oid", "=", "pg_constraint.connamespace"),
			)
			.fullJoin("pg_class", (join) =>
				join.onRef("pg_class.oid", "=", "pg_constraint.conrelid"),
			)
			.fullJoin("pg_attribute", (join) =>
				join
					.onRef("pg_attribute.attrelid", "=", "pg_class.oid")
					.on("pg_attribute.attnum", "=", sql`ANY(pg_constraint.conkey)`),
			)
			.fullJoin("information_schema.table_constraints", (join) =>
				join.onRef(
					"information_schema.table_constraints.constraint_name",
					"=",
					"pg_constraint.conname",
				),
			)
			.select([
				sql<"UNIQUE">`'UNIQUE'`.as("constraintType"),
				"pg_class.relname as table",
				sql<string[]>`json_agg(pg_attribute.attname)`.as("columns"),
			])
			.select((eb) => [
				eb
					.case()
					.when(
						sql`information_schema.table_constraints.nulls_distinct = 'YES'`,
					)
					.then(true)
					.else(false)
					.end()
					.as("nullsDistinct"),
			])
			.where("pg_constraint.contype", "=", "u")
			.where("pg_constraint.conname", "~", "kinetic_key$")
			.where("pg_namespace.nspname", "=", databaseSchema)
			.where("pg_class.relname", "in", tableNames)
			.groupBy(["table", "information_schema.table_constraints.nulls_distinct"])
			.execute();
		const transformedResults = results.reduce<UniqueInfo>((acc, result) => {
			const keyName = `${result.table}_${result.columns.join("_")}_kinetic_key`;
			const constraintInfo = {
				[keyName]: uniqueConstraintInfoToQuery(result),
			};
			const table = result.table;
			if (table !== null) {
				acc[table] = {
					...acc[table],
					...constraintInfo,
				};
			}
			return acc;
		}, {});
		return {
			status: ActionStatus.Success,
			result: transformedResults,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}
