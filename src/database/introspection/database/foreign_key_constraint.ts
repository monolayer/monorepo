import { type Kysely, sql } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { InformationSchemaDB } from "./types.js";

type ForeignKeyRule =
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
): Promise<
	OperationSuccess<Array<ForeignKeyConstraintInfo>> | OperationAnyError
> {
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
			.where("con.conname", "~", "kinetic_fkey$")
			.where("con.conname", "~", "^k_fk_")
			.where("tbl.relname", "!=", "geometry_columns")
			.where("tbl.relname", "!=", "spatial_ref_sys")
			.where("tbl.relname", "!=", "kysely_migration_lock")
			.where("tbl.relname", "!=", "kysely_migration")
			.where("tbl.relname", "!=", "VIEW")
			.groupBy([
				"tbl.relname",
				"ref_tbl.relname",
				"rc.delete_rule",
				"rc.update_rule",
				"con.confrelid",
			])
			.execute();
		return {
			status: ActionStatus.Success,
			result: results,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}
