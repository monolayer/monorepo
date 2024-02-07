import { type Kysely, sql } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import { primaryKeyConstraintInfoToQuery } from "../info_to_query.js";
import type { InformationSchemaDB } from "./types.js";

export type PrimaryKeyConstraintInfo = {
	constraintType: "PRIMARY KEY";
	table: string | null;
	columns: string[];
};

export async function dbPrimaryKeyConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<Record<string, string>> | OperationAnyError> {
	try {
		if (tableNames.length === 0) {
			return {
				status: ActionStatus.Success,
				result: {},
			};
		}
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
			.where("con.conname", "~", "kinetic_pk$")
			.where("tbl.relname", "in", tableNames)
			.groupBy(["tbl.relname"])
			.orderBy(["table"])
			.execute();
		const transformedResults = results.reduce<Record<string, string>>(
			(acc, result) => {
				const key = `${result.table}_${result.columns.join("_")}_kinetic_pk`;
				acc[key] = primaryKeyConstraintInfoToQuery(result);
				return acc;
			},
			{},
		);
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
