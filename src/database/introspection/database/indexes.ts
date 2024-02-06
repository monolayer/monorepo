import { Kysely, sql } from "kysely";
import {
	ActionStatus,
	OperationAnyError,
	OperationSuccess,
} from "~/cli/command.js";
import { IndexInfo } from "../types.js";
import type { InformationSchemaDB } from "./types.js";

export async function dbIndexInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<IndexInfo> | OperationAnyError> {
	if (tableNames.length === 0) {
		return {
			status: ActionStatus.Success,
			result: {},
		};
	}

	try {
		const results = await kysely
			.selectFrom("pg_class")
			.innerJoin("pg_index", "pg_class.oid", "pg_index.indrelid")
			.innerJoin(
				"pg_class as pg_class_2",
				"pg_index.indexrelid",
				"pg_class_2.oid",
			)
			.leftJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
			.select([
				"pg_class.relname as table",
				"pg_class_2.relname as name",
				sql<string>`pg_get_indexdef(pg_index.indexrelid)`.as("definition"),
			])
			.distinct()
			.where("pg_class_2.relkind", "in", ["i", "I"])
			.where("pg_index.indisprimary", "=", false)
			.where("pg_class.relname", "in", tableNames)
			.where("pg_namespace.nspname", "=", databaseSchema)
			.orderBy("pg_class_2.relname")
			.execute();
		const indexInfo = results.reduce<IndexInfo>((acc, curr) => {
			acc[curr.table] = {
				...acc[curr.table],
				...{ [curr.name]: curr.definition },
			};
			return acc;
		}, {});
		return {
			status: ActionStatus.Success,
			result: indexInfo,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}
