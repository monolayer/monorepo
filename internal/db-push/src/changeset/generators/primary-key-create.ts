import {
	extractColumnsFromPrimaryKey,
	findColumnByNameInTable,
} from "@monorepo/pg/introspection/schema.js";
import { gen } from "effect/Effect";
import { dropNotNull } from "../../ddl/ddl.js";
import { OnlinePrimaryKey } from "../../ddl/primary-key.js";
import {
	ChangesetGeneratorState,
	type ChangesetGenerator,
} from "../../state/changeset-generator.js";
import { resolveCurrentTableName, type AnyKysely } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { CreatePrimaryKeyDiff } from "../types/diff.js";

export function createPrimaryKeyChangeset(diff: CreatePrimaryKeyDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const primaryKeyName = Object.keys(diff.value)[0];
		const primaryKeyValue = diff.value[primaryKeyName ?? ""];
		if (primaryKeyValue === undefined) {
			return;
		}
		const onlinePrimaryKey = new OnlinePrimaryKey(
			tableName,
			primaryKeyName as string,
			primaryKeyValue,
			context,
		);

		const changeset: CodeChangeset[] = [
			{
				priority: MigrationOpPriority.IndexCreate,
				phase: ChangesetPhase.Alter,
				schemaName: context.schemaName,
				tableName: tableName,
				currentTableName: resolveCurrentTableName(tableName, context),
				type: ChangesetType.CreateIndex,
				transaction: false,
				up: onlinePrimaryKey.index.up,
				down: onlinePrimaryKey.index.down,
			},
			{
				priority: MigrationOpPriority.PrimaryKeyCreate,
				phase: ChangesetPhase.Alter,
				schemaName: context.schemaName,
				tableName: tableName,
				currentTableName: resolveCurrentTableName(tableName, context),
				type: ChangesetType.CreatePrimaryKey,
				up: onlinePrimaryKey.up,
				down: onlinePrimaryKey.down,
				warnings: onlinePrimaryKey.warnings,
			},
			...dropNotNullChangesets(
				primaryKeyValue,
				tableName,
				context,
				"down",
				ChangesetPhase.Alter,
			),
		];
		return changeset;
	});
}

export function dropNotNullChangesets(
	primaryKeyValue: string,
	tableName: string,
	context: ChangesetGenerator,
	direction: "up" | "down",
	phase: ChangesetPhase.Alter | ChangesetPhase.Expand = ChangesetPhase.Alter,
) {
	const primaryKeyColumns = extractColumnsFromPrimaryKey(primaryKeyValue);
	const changesets: CodeChangeset[] = [];

	if (primaryKeyColumns !== null && primaryKeyColumns !== undefined) {
		for (const column of primaryKeyColumns) {
			const table = context.local.table[tableName];
			if (table !== undefined) {
				const tableColumn =
					table.columns[column] || findColumnByNameInTable(table, column);
				if (tableColumn !== undefined) {
					if (tableColumn.originalIsNullable === undefined) {
						if (tableColumn.isNullable) {
							changesets.push({
								priority: MigrationOpPriority.ChangeColumnNullable,
								phase: phase,
								schemaName: context.schemaName,
								tableName: tableName,
								currentTableName: resolveCurrentTableName(tableName, context),
								type: ChangesetType.ChangeColumnNullable,
								up:
									direction === "up"
										? dropNotNull({
												schemaName: context.schemaName,
												tableName,
												columnName: column,
												debug: context.debug,
											})
										: async (db: AnyKysely) => {},
								down:
									direction === "down"
										? dropNotNull({
												schemaName: context.schemaName,
												tableName,
												columnName: column,
												debug: false,
											})
										: async (db: AnyKysely) => {},
							});
						}
					} else {
						if (tableColumn.originalIsNullable !== tableColumn.isNullable) {
							changesets.push({
								priority: MigrationOpPriority.ChangeColumnNullable,
								phase: phase,
								schemaName: context.schemaName,
								tableName: tableName,
								currentTableName: resolveCurrentTableName(tableName, context),
								type: ChangesetType.ChangeColumnNullable,
								up:
									direction === "up"
										? dropNotNull({
												schemaName: context.schemaName,
												tableName,
												columnName: column,
												debug: context.debug,
											})
										: async (db: AnyKysely) => {},
								down:
									direction === "down"
										? dropNotNull({
												schemaName: context.schemaName,
												tableName,
												columnName: column,
												debug: false,
											})
										: async (db: AnyKysely) => {},
							});
						}
					}
				}
			} else {
				changesets.push({
					priority: MigrationOpPriority.ChangeColumnNullable,
					phase: phase,
					schemaName: context.schemaName,
					tableName: tableName,
					currentTableName: resolveCurrentTableName(tableName, context),
					type: ChangesetType.ChangeColumnNullable,
					up:
						direction === "up"
							? dropNotNullOp(tableName, column, context.schemaName)
							: async (db: AnyKysely) => {},
					down:
						direction === "down"
							? dropNotNullOp(tableName, column, context.schemaName)
							: async (db: AnyKysely) => {},
				});
			}
		}
	}
	return changesets;
}

function dropNotNullOp(
	tableName: string,
	columnName: string,
	schemaName: string,
) {
	return async (db: AnyKysely) => {
		await db
			.withSchema(schemaName)
			.schema.alterTable(tableName)
			.alterColumn(columnName, (col) => col.dropNotNull())
			.execute();
	};
}
