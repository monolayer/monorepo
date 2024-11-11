/* eslint-disable require-yield */
/* eslint-disable max-lines */
import {
	changedColumnNames,
	currentColumName,
} from "@monorepo/pg/introspection/column-name.js";
import { indexNameFromDefinition } from "@monorepo/pg/introspection/index.js";
import {
	columnNameKey,
	extractColumnsFromPrimaryKey,
} from "@monorepo/pg/introspection/schema.js";
import { gen } from "effect/Effect";
import type {
	Difference,
	DifferenceChange,
	DifferenceCreate,
	DifferenceRemove,
} from "microdiff";
import {
	ChangesetGeneratorState,
	type ChangesetGenerator,
} from "../../state/changeset-generator.js";
import {
	resolveTableName,
	type ColumnInfoDiff,
	type ColumnsInfoDiff,
} from "../introspection.js";
import type { ColumnInfo } from "./schema.js";

export interface CreateTableDiff extends DifferenceCreate {
	path: ["table", string];
	value: {
		columns: ColumnsInfoDiff;
		primaryKey: Record<string, string> | undefined;
		foreignKeys: Record<string, string> | undefined;
		checkConstraints: Record<string, string> | undefined;
		uniqueConstraints: Record<string, string> | undefined;
	};
}

export function isCreateTableDiff(diff: Difference) {
	return gen(function* () {
		if (
			diff.type === "CREATE" &&
			diff.path.length === 2 &&
			diff.path[0] === "table" &&
			typeof diff.path[1] === "string" &&
			Object.keys(diff.value).includes("name") &&
			Object.keys(diff.value).includes("columns") &&
			Object.keys(diff.value).includes("primaryKey") &&
			Object.keys(diff.value).includes("foreignKeys") &&
			Object.keys(diff.value).includes("checkConstraints") &&
			Object.keys(diff.value).includes("uniqueConstraints")
		) {
			const currentName = yield* resolveTableName(diff.path[1], "current");
			const previousName = yield* resolveTableName(diff.path[1], "previous");
			if (currentName === previousName) {
				return true;
			}
		}
		return false;
	});
}

export interface DropTableDiff extends DifferenceRemove {
	type: "REMOVE";
	path: ["table", string];
	oldValue: {
		columns: ColumnsInfoDiff;
		primaryKey: Record<string, string> | undefined;
		foreignKeys: Record<string, string> | undefined;
		checkConstraints: Record<string, string> | undefined;
		uniqueConstraints: Record<string, string> | undefined;
	};
}

export function isDropTableDiff(diff: Difference) {
	return gen(function* () {
		if (
			diff.type === "REMOVE" &&
			diff.path.length === 2 &&
			diff.path[0] === "table" &&
			typeof diff.path[1] === "string"
		) {
			return true;
		}
		return false;
	});
}

export interface RenameTableDiff extends DifferenceChange {
	path: ["table", string, "name"];
	value: string;
	oldValue: string;
}

export function isRenameTableDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path.length === 3 &&
			test.path[0] === "table" &&
			test.path[2] === "name" &&
			typeof test.value === "string" &&
			typeof test.oldValue === "string"
		);
	});
}

export function byCreateTableDiff(test: Difference): test is CreateTableDiff {
	return (
		test.type === "CREATE" && test.path.length === 2 && test.path[0] === "table"
	);
}

export function byDropTableDiff(test: Difference): test is DropTableDiff {
	return (
		test.type === "REMOVE" && test.path.length === 2 && test.path[0] === "table"
	);
}

export interface CreateCheckDiff extends DifferenceCreate {
	path: ["checkConstraints", string, string];
	value: string;
}

export function isCreateCheckDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path[0] === "checkConstraints" &&
			test.path.length === 3 &&
			typeof test.value === "string"
		);
	});
}

export interface CreateMultipleCheckDiff extends DifferenceCreate {
	path: ["checkConstraints", string];
	value: Record<string, string>;
}

export function isCreateMultipleCheckDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path[0] === "checkConstraints" &&
			typeof test.path[1] === "string" &&
			test.path.length === 2
		);
	});
}

export interface DropCheckDiff extends DifferenceRemove {
	path: ["checkConstraints", string, string];
	oldValue: string;
}

export function isDropCheckDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path[0] === "checkConstraints" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			test.path.length === 3 &&
			typeof test.oldValue === "string"
		);
	});
}

export interface DropMultipleCheckDiff extends DifferenceRemove {
	path: ["checkConstraints", string];
	oldValue: Record<string, string>;
}

export function isDropMultipleChecksDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path[0] === "checkConstraints" &&
			typeof test.path[1] === "string" &&
			test.path.length === 2 &&
			!(yield* isDroppedTable(test.path[1]))
		);
	});
}

export interface RenameCheckDiff extends DifferenceChange {
	path: ["checkConstraints", string, string];
	value: string;
	oldValue: string;
}

export function isRenameCheckDiff(test: Difference) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		return (
			test.type === "CHANGE" &&
			test.path[0] === "checkConstraints" &&
			test.path.length === 3 &&
			typeof test.path[1] === "string" &&
			changedColumnNames(
				test.path[1],
				context.schemaName,
				context.columnsToRename,
			).length > 0
		);
	});
}

export interface ChangeEnumDiff extends DifferenceChange {
	path: ["enums", string];
	value: string;
	oldValue: string;
}

export function isChangeEnumDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "enums" &&
			typeof test.value === "string" &&
			typeof test.oldValue === "string" &&
			test.value
				.split(", ")
				.filter((value) => value !== "")
				.filter((value) => !test.oldValue.split(", ").includes(value))
				.length !== 0
		);
	});
}

export interface CreateEnumDiff extends DifferenceCreate {
	path: ["enums", string];
	value: string;
}

export function isCreateEnumDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path[0] === "enums" &&
			typeof test.value === "string"
		);
	});
}

export interface DropEnumDiff extends DifferenceRemove {
	path: ["enums", string];
	oldValue: string;
}

export function isDropEnumDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path[0] === "enums" &&
			typeof test.oldValue === "string"
		);
	});
}

export interface CreateExtensionDiff extends DifferenceCreate {
	path: ["extensions", string];
	value: boolean;
}

export function isCreateExtensionDiff(test: Difference) {
	return gen(function* () {
		if (
			test.type === "CREATE" &&
			test.path[0] === "extensions" &&
			test.path.length === 2 &&
			test.value !== undefined
		) {
			return true;
		}
		return false;
	});
}

export interface DropExtensionDiff extends DifferenceRemove {
	path: ["extensions", string];
	oldValue: boolean;
}

export function isDropExtensionDiff(test: Difference) {
	return gen(function* () {
		if (
			test.type === "REMOVE" &&
			test.path[0] === "extensions" &&
			test.path.length === 2 &&
			test.oldValue !== undefined
		) {
			return true;
		}
		return false;
	});
}

export interface CreateSchemaDiff extends DifferenceCreate {
	path: ["schemaInfo", string];
	value: true;
}

export function isCreateSchemaDiff(test: Difference) {
	return gen(function* () {
		console.log(test);
		if (
			test.type === "CREATE" &&
			test.path[0] === "schemaInfo" &&
			typeof test.path[1] === "string" &&
			test.value === true
		) {
			return true;
		}
		return false;
	});
}

export interface DropSchemaDiff extends DifferenceRemove {
	path: ["schemaInfo", string];
	oldValue: true;
}

export function isDropSchemaDiff(test: Difference) {
	return gen(function* () {
		if (
			test.type === "REMOVE" &&
			test.path[0] === "schemaInfo" &&
			typeof test.path[1] === "string" &&
			test.oldValue === true
		) {
			return true;
		}
		return false;
	});
}

export interface ColumnDataTypeDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "dataType"];
	value: string | null;
	oldValue: string | null;
}

export function isColumnDataTypeDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "table" &&
			test.path.length === 5 &&
			test.path[2] === "columns" &&
			test.path[4] === "dataType"
		);
	});
}

export interface AddColumnDefaultDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "defaultValue"];
	value: string;
	oldValue: null;
}

export function isAddColumnDefaultDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "table" &&
			test.path.length === 5 &&
			test.path[2] === "columns" &&
			test.path[4] === "defaultValue" &&
			test.value !== null &&
			test.oldValue === null
		);
	});
}

export interface DropColumnDefaultDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "defaultValue"];
	value: null;
	oldValue: string;
}

export function isColumnDropDefaultDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "table" &&
			test.path.length === 5 &&
			test.path[2] === "columns" &&
			test.path[4] === "defaultValue" &&
			test.value === null &&
			test.oldValue !== null
		);
	});
}

export interface ChangeColumnDefaultDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "defaultValue"];
	value: string;
	oldValue: string;
}

export function isChangeColumnDefaultDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "table" &&
			test.path.length === 5 &&
			test.path[2] === "columns" &&
			test.path[4] === "defaultValue" &&
			test.value !== null &&
			test.oldValue !== null
		);
	});
}

export interface AddColumnIdentityDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "identity"];
	value: NonNullable<ColumnInfo["identity"]>;
	oldValue: null;
}

export function isAddColumnIdentityDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "table" &&
			test.path.length === 5 &&
			test.path[2] === "columns" &&
			test.path[4] === "identity" &&
			test.value !== null &&
			test.oldValue === null
		);
	});
}

export interface DropColumnIdentityDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "identity"];
	value: null;
	oldValue: NonNullable<ColumnInfo["identity"]>;
}

export function isDropColumnIdentityDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "table" &&
			test.path.length === 5 &&
			test.path[2] === "columns" &&
			test.path[4] === "identity" &&
			test.value === null &&
			test.oldValue !== null
		);
	});
}

export interface ColumnNullableDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "isNullable"];
	value: boolean;
	oldValue: boolean;
}

export function isColumnNullableDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "table" &&
			test.path.length === 5 &&
			test.path[2] === "columns" &&
			test.path[4] === "isNullable"
		);
	});
}

export interface DropColumnDiff extends DifferenceRemove {
	path: ["table", string, "columns", string];
	oldValue: ColumnInfoDiff;
}

export function isColumnDropDiff(test: Difference) {
	return gen(function* () {
		return columnDropTest(test);
	});
}

export function byDropColumn(test: Difference): test is DropColumnDiff {
	return columnDropTest(test);
}

function columnDropTest(test: Difference) {
	return (
		test.type === "REMOVE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns"
	);
}

export interface CreateColumnDiff extends DifferenceCreate {
	path: ["table", string, "column", string];
	value: ColumnInfoDiff;
}

export function isCreateColumnDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 4 &&
			test.path[0] === "table" &&
			typeof test.path[1] === "string" &&
			test.path[2] === "columns" &&
			test.value.isNullable !== false
		);
	});
}

export function byCreateColumn(test: Difference) {
	return (
		test.type === "CREATE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		typeof test.path[1] === "string" &&
		test.path[2] === "columns"
	);
}

export interface RenameColumnDiff extends DifferenceChange {
	path: ["table", string, "columns", string, "columnName"];
	value: string;
	oldValue: string;
}

export function isRenameColumnDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path.length === 5 &&
			test.path[0] === "table" &&
			typeof test.path[1] === "string" &&
			test.path[2] === "columns" &&
			typeof test.path[3] === "string" &&
			test.path[4] === "columnName"
		);
	});
}

export function isCreateNonNullableColumnDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 4 &&
			test.path[0] === "table" &&
			typeof test.path[1] === "string" &&
			test.path[2] === "columns" &&
			test.value.isNullable === false
		);
	});
}

export interface CreateMultipleUniqueDiff extends DifferenceCreate {
	path: ["uniqueConstraints", string];
	value: {
		[key: string]: string;
	};
}

export function isCreateMultipleUniqueDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 2 &&
			test.path[0] === "uniqueConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.value === "object"
		);
	});
}

export interface CreateUniqueDiff extends DifferenceCreate {
	path: ["uniqueConstraints", string, string];
	value: string;
}

export function isCreateUniqueDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 3 &&
			test.path[0] === "uniqueConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string"
		);
	});
}

export interface DropMultipleUniqueDiff extends DifferenceRemove {
	path: ["uniqueConstraints", string];
	oldValue: {
		[key: string]: string;
	};
}

export function isDropMultipleUniqueDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path.length === 2 &&
			test.path[0] === "uniqueConstraints" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			typeof test.oldValue === "object"
		);
	});
}

export interface DropUniqueDiff extends DifferenceRemove {
	path: ["uniqueConstraints", string, string];
	oldValue: string;
}

export function isDropUniqueDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path.length === 3 &&
			test.path[0] === "uniqueConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			typeof test.path[2] === "string" &&
			typeof test.oldValue === "string"
		);
	});
}

export interface RenameUniqueDiff extends DifferenceChange {
	path: ["uniqueConstraints", string, string];
	value: string;
	oldValue: string;
}

export function isRenameUniqueDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path.length === 3 &&
			test.path[0] === "uniqueConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string" &&
			typeof test.oldValue === "string"
		);
	});
}

export interface CreatePrimaryKeyDiff extends DifferenceCreate {
	path: ["primaryKey", string];
	value: {
		[key: string]: string;
	};
}

export function isPrimaryKeyCreateDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 2 &&
			test.path[0] === "primaryKey" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			typeof test.value === "object" &&
			Object.keys(test.value).length === 1
		);
	});
}

export interface DropPrimaryKeyDiff extends DifferenceRemove {
	path: ["primaryKey", string];
	oldValue: {
		[key: string]: string;
	};
}

export function isPrimaryKeyDropDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path.length === 2 &&
			test.path[0] === "primaryKey" &&
			typeof test.path[1] === "string" &&
			typeof test.oldValue === "object" &&
			Object.keys(test.oldValue).length === 1 &&
			!(yield* isDroppedTable(test.path[1]))
		);
	});
}

export interface ChangePrimaryKeyDiff extends DifferenceChange {
	path: ["primaryKey", string, string];
	value: string;
	oldValue: string;
}

export function isPrimaryKeyChangeDiff(test: Difference) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		return (
			test.type === "CHANGE" &&
			test.path.length === 3 &&
			test.path[0] === "primaryKey" &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string" &&
			typeof test.oldValue === "string" &&
			primaryKeyColumnsChange(context, test.path[1], test.value, test.oldValue)
		);
	});
}

function primaryKeyColumnsChange(
	{ local, columnsToRename, schemaName }: ChangesetGenerator,
	tableName: string,
	value: string,
	oldValue: string,
) {
	const tb = local.table[tableName]!;
	const oldColumns = extractColumnsFromPrimaryKey(oldValue)
		.map((val) => currentColumName(tableName, schemaName, val, columnsToRename))
		.sort();

	const newColumns = extractColumnsFromPrimaryKey(value)
		.map((val) => currentColumName(tableName, schemaName, val, columnsToRename))
		.map((val) => columnNameKey(tb, val))
		.filter((x) => x !== undefined)
		.sort();

	return (
		newColumns.length !== oldColumns.length ||
		!newColumns.every((col, i) => col === oldColumns[i])
	);
}

export interface CreateIndexDiff extends DifferenceCreate {
	path: ["index", string, string];
	value: string;
}

export function isCreateIndexDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path[0] === "index" &&
			test.path.length === 3 &&
			typeof test.value === "string"
		);
	});
}

export interface DropIndexDiff extends DifferenceRemove {
	path: ["index", string, string];
	oldValue: string;
}

export function isDropIndexDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path[0] === "index" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			test.path.length === 3 &&
			typeof test.oldValue === "string"
		);
	});
}

export interface CreateMultipleIndexesDiff extends DifferenceCreate {
	path: ["index", string];
	value: Record<string, string>;
}

export function isCreateMultipleIndexesDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path[0] === "index" &&
			test.path.length === 2
		);
	});
}

export interface DropMultipleIndexesDiff extends DifferenceRemove {
	path: ["index", string];
	oldValue: Record<string, string>;
}

export function isDropMultipleIndexesDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path[0] === "index" &&
			typeof test.path[1] === "string" &&
			test.path.length === 2 &&
			!(yield* isDroppedTable(test.path[1]))
		);
	});
}

export interface RenameIndexDiff extends DifferenceChange {
	path: ["index", string, string];
	value: string;
	oldValue: string;
}

export function isRenameIndexDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path[0] === "index" &&
			test.path.length === 3 &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string" &&
			typeof test.oldValue === "string" &&
			indexNameFromDefinition(test.value) !==
				indexNameFromDefinition(test.oldValue)
		);
	});
}

export interface CreateForeignKeyDiff extends DifferenceCreate {
	path: ["foreignKeyConstraints", string, string];
	value: string;
}

export function isCreateForeignKeyDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 3 &&
			test.path[0] === "foreignKeyConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string"
		);
	});
}

export interface CreateMultipleForeignKeyDiff extends DifferenceCreate {
	path: ["foreignKeyConstraints", string];
	value: {
		[key: string]: string;
	};
}

export function isCreateMultipleForeignKeyDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 2 &&
			test.path[0] === "foreignKeyConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.value === "object"
		);
	});
}

export interface DropForeignKeyDiff extends DifferenceRemove {
	type: "REMOVE";
	path: ["foreignKeyConstraints", string, string];
	oldValue: string;
}

export function isDropForeignKeyDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path.length === 3 &&
			test.path[0] === "foreignKeyConstraints" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			typeof test.path[2] === "string" &&
			typeof test.oldValue === "string"
		);
	});
}

export interface DropMultipleForeignKeyDiff extends DifferenceRemove {
	path: ["foreignKeyConstraints", string];
	oldValue: {
		[key: string]: string;
	};
}

export function isDropMultipleForeignKeyDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path.length === 2 &&
			test.path[0] === "foreignKeyConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.oldValue === "object" &&
			!(yield* isDroppedTable(test.path[1]))
		);
	});
}

export interface RenameForeignKeyDiff extends DifferenceChange {
	path: ["foreignKeyConstraints", string, string];
	value: string;
	oldValue: string;
}

export function isRenameForeignKeyDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path.length === 3 &&
			test.path[0] === "foreignKeyConstraints" &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string" &&
			typeof test.oldValue === "string"
		);
	});
}

export interface CreateMultipleTriggerDiff extends DifferenceCreate {
	path: ["triggers", string];
	value: {
		[key: string]: string;
	};
}

export function isCreateMultipleTriggerDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 2 &&
			test.path[0] === "triggers" &&
			typeof test.path[1] === "string" &&
			typeof test.value === "object"
		);
	});
}

export interface CreateTriggerDiff extends DifferenceCreate {
	path: ["triggers", string, string];
	value: string;
}

export function isCreateTriggerDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CREATE" &&
			test.path.length === 3 &&
			test.path[0] === "triggers" &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string"
		);
	});
}

export interface DropMultipleTriggerDiff extends DifferenceRemove {
	path: ["triggers", string];
	oldValue: {
		[key: string]: string;
	};
}

export function isDropMultipleTriggerDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path.length === 2 &&
			test.path[0] === "triggers" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			typeof test.oldValue === "object"
		);
	});
}

export interface DropTriggerDiff extends DifferenceRemove {
	path: ["triggers", string, string];
	oldValue: string;
}

export function isDropTriggerDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "REMOVE" &&
			test.path.length === 3 &&
			test.path[0] === "triggers" &&
			typeof test.path[1] === "string" &&
			!(yield* isDroppedTable(test.path[1])) &&
			typeof test.path[2] === "string" &&
			typeof test.oldValue === "string"
		);
	});
}

export interface ChangeTriggerDiff extends DifferenceChange {
	path: ["triggers", string, string];
	value: string;
	oldValue: string;
}

export function isChangeTriggerDiff(test: Difference) {
	return gen(function* () {
		return (
			test.type === "CHANGE" &&
			test.path.length === 3 &&
			test.path[0] === "triggers" &&
			typeof test.path[1] === "string" &&
			typeof test.path[2] === "string" &&
			typeof test.value === "string" &&
			typeof test.oldValue === "string" &&
			test.value.split(":")[0] !== test.oldValue.split(":")[0]
		);
	});
}

function isDroppedTable(tableName: string) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		return context.droppedTables.includes(tableName);
	});
}
