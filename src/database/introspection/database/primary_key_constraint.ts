import { type Kysely, sql } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { InformationSchemaDB } from "./types.js";

export type PrimaryKeyConstraintInfo = {
	constraintType: "PRIMARY KEY";
	table: string | null;
	columns: string[];
};

export async function dbPrimaryKeyConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
): Promise<
	OperationSuccess<Array<PrimaryKeyConstraintInfo>> | OperationAnyError
> {
	try {
		const results = await kysely
			.selectFrom("pg_constraint as con")
			.fullJoin("pg_class as tbl", (join) =>
				join.onRef("tbl.oid", "=", "con.conrelid"),
			)
			.fullJoin("pg_namespace as ns", (join) =>
				join.onRef("tbl.relnamespace", "=", "ns.oid"),
			)
			.fullJoin("pg_attribute as att", (join) =>
				join
					.onRef("att.attrelid", "=", "tbl.oid")
					.on("att.attnum", "=", sql`ANY(con.conkey)`),
			)
			.select([
				sql<"PRIMARY KEY">`'PRIMARY KEY'`.as("constraintType"),
				"tbl.relname as table",
				sql<string[]>`json_agg(att.attname ORDER BY att.attnum)`.as("columns"),
			])
			.where("con.contype", "=", "p")
			.where("ns.nspname", "=", databaseSchema)
			.where("con.conname", "~", "kinetic_pkey$")
			.where("tbl.relname", "!=", "geometry_columns")
			.where("tbl.relname", "!=", "spatial_ref_sys")
			.where("tbl.relname", "!=", "kysely_migration_lock")
			.where("tbl.relname", "!=", "kysely_migration")
			.where("tbl.relname", "!=", "VIEW")
			.groupBy(["tbl.relname"])
			.orderBy(["table"])
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