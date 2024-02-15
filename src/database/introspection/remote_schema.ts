import type { Kysely } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import { MigrationSchema } from "../migrations/migration_schema.js";
import { dbColumnInfo } from "./database/columns.js";
import { dbExtensionInfo } from "./database/extensions.js";
import { dbForeignKeyConstraintInfo } from "./database/foreign_key_constraint.js";
import { dbIndexInfo } from "./database/indexes.js";
import { dbPrimaryKeyConstraintInfo } from "./database/primary_key_constraint.js";
import { dbTableInfo } from "./database/tables.js";
import { dbTriggerInfo } from "./database/triggers.js";
import { dbUniqueConstraintInfo } from "./database/unique_constraint.js";

export async function remoteSchema(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	kysely: Kysely<any>,
): Promise<OperationSuccess<MigrationSchema> | OperationAnyError> {
	const remoteTableInfo = await dbTableInfo(kysely, "public");
	if (remoteTableInfo.status === ActionStatus.Error) return remoteTableInfo;

	const tables = remoteTableInfo.result.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const remoteColumnInfo = await dbColumnInfo(kysely, "public", tables);
	if (remoteColumnInfo.status === ActionStatus.Error) return remoteColumnInfo;

	const remoteIndexInfo = await dbIndexInfo(kysely, "public", tables);
	if (remoteIndexInfo.status === ActionStatus.Error) return remoteIndexInfo;

	const remoteUniqueConstraintInfo = await dbUniqueConstraintInfo(
		kysely,
		"public",
		tables,
	);
	if (remoteUniqueConstraintInfo.status === ActionStatus.Error)
		return remoteUniqueConstraintInfo;

	const remoteForeignKeyConstraintInfo = await dbForeignKeyConstraintInfo(
		kysely,
		"public",
		tables,
	);
	if (remoteForeignKeyConstraintInfo.status === ActionStatus.Error)
		return remoteForeignKeyConstraintInfo;

	const primaryKeyConstraintInfo = await dbPrimaryKeyConstraintInfo(
		kysely,
		"public",
		tables,
	);

	if (primaryKeyConstraintInfo.status === ActionStatus.Error)
		return primaryKeyConstraintInfo;

	const extensionInfo = await dbExtensionInfo(kysely, "public");
	if (extensionInfo.status === ActionStatus.Error) return extensionInfo;

	const triggerInfo = await dbTriggerInfo(kysely, "public", tables);
	if (triggerInfo.status === ActionStatus.Error) return triggerInfo;

	return {
		status: ActionStatus.Success,
		result: {
			extensions: extensionInfo.result,
			table: remoteColumnInfo.result,
			index: remoteIndexInfo.result,
			foreignKeyConstraints: remoteForeignKeyConstraintInfo.result,
			uniqueConstraints: remoteUniqueConstraintInfo.result,
			primaryKey: primaryKeyConstraintInfo.result,
			triggers: triggerInfo.result,
		},
	};
}
