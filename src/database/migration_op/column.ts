import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "../changeset.js";
import { ColumnInfo } from "../introspection/types.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "./migration_op.js";
import { optionsForColumn } from "./table_common.js";

export function createColumnMigration(diff: CreateColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const columnDef = diff.value;

	const changeset: Changeset = {
		priority: MigrationOpPriority.Column,
		tableName: tableName,
		type: ChangeSetType.CreateColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`addColumn(\"${columnName}\", \"${columnDef.dataType}\"${optionsForColumn(
				columnDef,
			)})`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`dropColumn(\"${columnName}\")`,
		),
	};
	return changeset;
}

export function dropColumnMigration(diff: DropColumnDiff) {
	const tableName = diff.path[1];
	const columnDef = diff.oldValue;
	const columnName = diff.path[2];

	const changeset: Changeset = {
		priority: MigrationOpPriority.Column,
		tableName: tableName,
		type: ChangeSetType.DropColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`dropColumn(\"${columnName}\")`,
		),

		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`addColumn(\"${columnName}\", \"${columnDef.dataType}\"${optionsForColumn(
				columnDef,
			)})`,
		),
	};
	return changeset;
}

export function changeColumnMigration(diff: ChangeColumnDiff) {
	switch (diff.path[3]) {
		case "dataType":
			return columnDatatypeMigrationOperation(diff);
		case "defaultValue":
			return columnDefaultMigrationOperation(diff);
		case "isNullable":
			return columnNullableMigrationOperation(diff);
		case "primaryKey":
			return columnPrimaryKeyMigrationOperation(diff);
	}
}

export type CreateColumnDiff = {
	type: "CREATE";
	path: ["table", string, string];
	value: ColumnInfo;
};

export function isCreateColumn(test: Difference): test is CreateColumnDiff {
	return (
		test.type === "CREATE" && test.path.length === 3 && test.path[0] === "table"
	);
}

export type DropColumnDiff = {
	type: "REMOVE";
	path: ["table", string, string];
	oldValue: ColumnInfo;
};

export function isDropColumn(test: Difference): test is DropColumnDiff {
	return (
		test.type === "REMOVE" && test.path.length === 3 && test.path[0] === "table"
	);
}

type ColumnChangeAttr = Pick<
	ColumnInfo,
	"dataType" | "defaultValue" | "isNullable" | "primaryKey"
>;

export type ChangeColumnDiff = {
	type: "CHANGE";
	path: ["table", string, string, keyof ColumnChangeAttr];
	value: string | boolean | number | null;
	oldValue: string | boolean | number | null;
};

export function isChangeColumn(test: Difference): test is ChangeColumnDiff {
	const columNames = ["dataType", "defaultValue", "isNullable", "primaryKey"];

	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] !== undefined &&
		columNames.includes(test.path[3].toString())
	);
}

function columnDatatypeMigrationOperation(diff: ChangeColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDatatype,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDataType("${diff.value}"))`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDataType("${diff.oldValue}"))`,
		),
	};
	return changeset;
}

function columnDefaultMigrationOperation(diff: ChangeColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnBase,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropDefault())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setDefault("${diff.value}"))`,
				  ),
		down:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setDefault("${diff.oldValue}"))`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropDefault())`,
				  ),
	};
	return changeset;
}

function columnNullableMigrationOperation(diff: ChangeColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnBase,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropNotNull())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setNotNull())`,
				  ),
		down:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setNotNull())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropNotNull())`,
				  ),
	};
	return changeset;
}

function columnPrimaryKeyMigrationOperation(diff: ChangeColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority:
			diff.value === null
				? MigrationOpPriority.ChangeColumnPrimaryKeyDrop
				: MigrationOpPriority.ChangeColumnPrimaryKeyCreate,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`dropConstraint(\"${tableName}_pk\")`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.primaryKey())`,
				  ),
		down:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.primaryKey())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`dropConstraint(\"${tableName}_pk\")`,
				  ),
	};
	return changeset;
}
