import { sql, type Kysely } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { ForeignKeyInfo } from "~/database/migrations/migration_schema.js";
import { foreignKeyConstraintInfoToQuery } from "../info_to_query.js";
import type { InformationSchemaDB } from "./types.js";

export type ForeignKeyRule =
	| "CASCADE"
	| "SET NULL"
	| "SET DEFAULT"
	| "RESTRICT"
	| "NO ACTION";

export type ForeignKeyConstraintInfo = {
	constraintType: "FOREIGN KEY";
	table: string | null;
	column: string[];
	targetTable: string | null;
	targetColumns: string[];
	deleteRule: ForeignKeyRule | null;
	updateRule: ForeignKeyRule | null;
};

export async function dbForeignKeyConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<ForeignKeyInfo> | OperationAnyError> {
	if (tableNames.length === 0) {
		return {
			status: ActionStatus.Success,
			result: {},
		};
	}

	try {
		const results = await kysely
			.selectFrom("pg_constraint as con")
			.fullJoin("pg_class as tbl", (join) =>
				join.onRef("tbl.oid", "=", "con.conrelid"),
			)
			.fullJoin("pg_namespace as ns", (join) =>
				join.onRef("ns.oid", "=", "tbl.relnamespace"),
			)
			.fullJoin("pg_attribute as col", (join) =>
				join
					.onRef("col.attrelid", "=", "tbl.oid")
					.on("col.attnum", "=", sql`ANY(con.conkey)`),
			)
			.fullJoin("pg_class as ref_tbl", (join) =>
				join.onRef("con.confrelid", "=", "ref_tbl.oid"),
			)
			.fullJoin("pg_attribute as relcol", (join) =>
				join
					.onRef("relcol.attrelid", "=", "ref_tbl.oid")
					.on("relcol.attnum", "=", sql`ANY(con.conkey)`),
			)
			.fullJoin("information_schema.referential_constraints as rc", (join) =>
				join.onRef("rc.constraint_name", "=", "con.conname"),
			)
			.fullJoin("information_schema.constraint_column_usage as cu", (join) =>
				join.onRef("cu.constraint_name", "=", "con.conname"),
			)
			.select([
				sql<"FOREIGN KEY">`'FOREIGN KEY'`.as("constraintType"),
				"tbl.relname as table",
				sql<string[]>`JSON_AGG(DISTINCT col.attname)`.as("column"),
				"ref_tbl.relname as targetTable",
				sql<string[]>`JSON_AGG(DISTINCT cu.column_name)`.as("targetColumns"),
				"rc.delete_rule as deleteRule",
				"rc.update_rule as updateRule",
			])
			.where("con.contype", "=", "f")
			.where("ns.nspname", "=", databaseSchema)
			.where("con.conname", "~", "kinetic_fk$")
			.where("tbl.relname", "in", tableNames)
			.groupBy([
				"tbl.relname",
				"ref_tbl.relname",
				"rc.delete_rule",
				"rc.update_rule",
				"con.confrelid",
			])
			.execute();
		const transformedResults = results.reduce<ForeignKeyInfo>((acc, result) => {
			const key = `${result.table}_${result.column.join("_")}_${
				result.targetTable
			}_${result.targetColumns.join("_")}_kinetic_fk`;
			const constraintInfo = {
				[key]: foreignKeyConstraintInfoToQuery(result),
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
