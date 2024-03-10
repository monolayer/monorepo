import type { Kysely } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { AnyPgDatabase } from "~/schema/pg_database.js";
import type { InformationSchemaDB } from "./types.js";

export async function dbExtensionInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
): Promise<OperationSuccess<ExtensionInfo> | OperationAnyError> {
	try {
		const results = await kysely
			.selectFrom("pg_extension")
			.leftJoin("pg_namespace", "pg_extension.extnamespace", "pg_namespace.oid")
			.select(["extname"])
			.where("pg_namespace.nspname", "=", databaseSchema)
			.where("extname", "!=", "plpgsql")
			.execute();

		const extensionInfo = results.reduce<ExtensionInfo>((acc, curr) => {
			acc[curr.extname] = true;
			return acc;
		}, {});

		return {
			status: ActionStatus.Success,
			result: extensionInfo,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}

export function localExtensionInfo(schema: AnyPgDatabase) {
	return schema.extensions.reduce<ExtensionInfo>((acc, curr) => {
		acc[curr] = true;
		return acc;
	}, {});
}

export type ExtensionInfo = Record<string, boolean>;
