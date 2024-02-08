import type { OnModifyForeignAction } from "kysely";
import { Difference } from "microdiff";
import {
	type DbTableInfo,
	ForeIgnKeyConstraintInfo,
	type LocalTableInfo,
} from "~/database/introspection/types.js";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

export type AddForeignKeyConstraintDiff = {
	type: "CHANGE";
	path: ["table", string, string, "foreignKeyConstraint"];
	value: ForeIgnKeyConstraintInfo;
	oldValue: null;
};

export type RemoveForeignKeyConstraint = {
	type: "CHANGE";
	path: ["table", string, string, "foreignKeyConstraint"];
	value: null;
	oldValue: ForeIgnKeyConstraintInfo;
};

export type ChangeForeignConstraintDiff = {
	type: "CHANGE";
	path: ["table", string, string, "foreignKeyConstraint", "options"];
	value: `${OnModifyForeignAction};${OnModifyForeignAction}`;
	oldValue: `${OnModifyForeignAction};${OnModifyForeignAction}`;
};

export function isAddForeignKeyConstraint(
	test: Difference,
): test is AddForeignKeyConstraintDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "foreignKeyConstraint" &&
		test.value !== null
	);
}

export function isRemoveForeignKeyConstraint(
	test: Difference,
): test is RemoveForeignKeyConstraint {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "foreignKeyConstraint" &&
		test.oldValue !== null
	);
}

export function isChangeOptionsForeignKeyConstraint(
	test: Difference,
): test is ChangeForeignConstraintDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[3] === "foreignKeyConstraint" &&
		test.path[4] === "options" &&
		test.value !== null &&
		test.oldValue !== null
	);
}

export function addColumnForeignKeyMigrationOperation(
	diff: AddForeignKeyConstraintDiff,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnForeignKeyCreate,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			[
				`.addForeignKeyConstraint("${tableName}_${columnName}_fkey",`,
				`["${columnName}"], "${diff.value.table}",`,
				`["${diff.value.column}"])`,
			].join(" "),
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`.dropConstraint("${tableName}_${columnName}_fkey")`,
		),
	};
	return changeset;
}

export function removeColumnForeignKeyMigrationOperation(
	diff: RemoveForeignKeyConstraint,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnForeignKeyDrop,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`.dropConstraint("${tableName}_${columnName}_fkey")`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			[
				`.addForeignKeyConstraint("${tableName}_${columnName}_fkey",`,
				`["${columnName}"], "${diff.oldValue.table}",`,
				`["${diff.oldValue.column}"])`,
			].join(" "),
		),
	};
	return changeset;
}

export function changeColumnForeignKeyMigrationOperation(
	diff: ChangeForeignConstraintDiff,
	local: LocalTableInfo,
	db: DbTableInfo,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const newOptions = diff.value.split(";");
	const oldOptions = diff.oldValue.split(";");
	const localColumnInfo = local.table[tableName]?.[columnName];
	const dbColumnInfo = db.table[tableName]?.[columnName];
	if (!localColumnInfo || !dbColumnInfo) {
		return [];
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnForeignKeyChange,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselyDbStatement(
			[
				`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_fkey`,
				`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_fkey FOREIGN KEY (${columnName}) REFERENCES ${localColumnInfo.foreignKeyConstraint?.table}(${localColumnInfo.foreignKeyConstraint?.column}) ON DELETE ${newOptions[0]} ON UPDATE ${newOptions[1]}`,
			].join(", "),
		),
		down: executeKyselyDbStatement(
			[
				`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_fkey`,
				`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_fkey FOREIGN KEY (${columnName}) REFERENCES ${localColumnInfo.foreignKeyConstraint?.table}(${localColumnInfo.foreignKeyConstraint?.column}) ON DELETE ${oldOptions[0]} ON UPDATE ${oldOptions[1]}`,
			].join(", "),
		),
	};
	return changeset;
}

// "ALTER TABLE members DROP CONSTRAINT members_book_id_fkey",
// "ALTER TABLE members ADD CONSTRAINT members_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE",
