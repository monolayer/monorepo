import { type Kysely, sql } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
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
): Promise<OperationSuccess<Array<UniqueConstraintInfo>> | OperationAnyError> {
	try {
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
			.where("pg_class.relname", "!=", "geometry_columns")
			.where("pg_class.relname", "!=", "spatial_ref_sys")
			.where("pg_class.relname", "!=", "kysely_migration_lock")
			.where("pg_class.relname", "!=", "kysely_migration")
			.where("pg_class.relname", "!=", "VIEW")
			.groupBy(["table", "information_schema.table_constraints.nulls_distinct"])
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
