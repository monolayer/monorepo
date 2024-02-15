import { type Kysely, sql } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { TriggerInfo } from "../types.js";
import type { InformationSchemaDB } from "./types.js";

export async function dbTriggerInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<TriggerInfo> | OperationAnyError> {
	if (tableNames.length === 0) {
		return {
			status: ActionStatus.Success,
			result: {},
		};
	}

	try {
		const results = await kysely
			.selectFrom("pg_trigger")
			.innerJoin("pg_class", "pg_class.oid", "pg_trigger.tgrelid")
			.innerJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
			.select([
				"pg_trigger.tgname as trigger_name",
				"pg_class.relname as table_name",
				sql<string>`pg_get_triggerdef(pg_trigger.oid)`.as("definition"),
				sql<string>`obj_description(pg_trigger.oid, 'pg_trigger')`.as(
					"comment",
				),
			])
			.where("pg_namespace.nspname", "=", databaseSchema)
			.where("pg_class.relname", "in", tableNames)
			.where("pg_trigger.tgname", "~", "_trg$")
			.execute();

		const triggerInfo = results.reduce<TriggerInfo>((acc, curr) => {
			acc[curr.table_name] = {
				...acc[curr.table_name],
				...{
					[curr.trigger_name]: `${curr.comment}:${curr.definition}`,
				},
			};
			return acc;
		}, {});

		return {
			status: ActionStatus.Success,
			result: triggerInfo,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error,
		};
	}
}
