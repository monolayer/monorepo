import { Difference } from "microdiff";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/introspection/introspection.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
	sqlStatement,
} from "../../../../changeset/helpers.js";
import { toValueAndHash } from "../../changeset-helpers.js";

export function columnDefaultMigrationOpGenerator(
	diff: Difference,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_addedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
) {
	if (isColumnDefaultAddValue(diff)) {
		return columnDefaultAddMigrationOperation(diff);
	}
	if (isColumnDefaultDropValue(diff)) {
		return columnDefaultDropMigrationOperation(diff);
	}
	if (isColumnDefaultChangeValue(diff)) {
		return columnDefaultChangeMigrationOperation(diff);
	}
}

type ColumnDefaultAddDifference = {
	type: "CHANGE";
	path: ["table", string, string, "defaultValue"];
	value: string;
	oldValue: null;
};

type ColumnDefaultDropDifference = {
	type: "CHANGE";
	path: ["table", string, string, "defaultValue"];
	value: null;
	oldValue: string;
};

type ColumnDefaultChangeDifference = {
	type: "CHANGE";
	path: ["table", string, string, "defaultValue"];
	value: string;
	oldValue: string;
};

function isColumnDefaultAddValue(
	test: Difference,
): test is ColumnDefaultAddDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "defaultValue" &&
		test.value !== null &&
		test.oldValue === null
	);
}

function isColumnDefaultDropValue(
	test: Difference,
): test is ColumnDefaultDropDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "defaultValue" &&
		test.value === null &&
		test.oldValue !== null
	);
}

function isColumnDefaultChangeValue(
	test: Difference,
): test is ColumnDefaultChangeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "defaultValue" &&
		test.value !== null &&
		test.oldValue !== null
	);
}

function columnDefaultAddMigrationOperation(diff: ColumnDefaultAddDifference) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];

	const defaultValueAndHash = toValueAndHash(String(diff.value));

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultAdd,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
					defaultValueAndHash.value ?? "",
				)}))`,
			),
			executeKyselyDbStatement(
				`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.dropDefault())`,
			),
		],
	};
	return changeset;
}

function columnDefaultDropMigrationOperation(
	diff: ColumnDefaultDropDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];

	const defaultValueAndHash = toValueAndHash(String(diff.oldValue));

	executeKyselyDbStatement(
		`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
	);
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultDrop,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.dropDefault())`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
					defaultValueAndHash.value ?? "",
				)}))`,
			),
			executeKyselyDbStatement(
				`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
			),
		],
	};
	return changeset;
}

function columnDefaultChangeMigrationOperation(
	diff: ColumnDefaultChangeDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];

	const newDefaultValueAndHash = toValueAndHash(String(diff.value));
	const oldDefaultValueAndHash = toValueAndHash(String(diff.oldValue));

	if (newDefaultValueAndHash.hash === oldDefaultValueAndHash.hash) {
		return [];
	}

	const up = [
		executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
				newDefaultValueAndHash.value ?? "",
			)}))`,
		),
	];

	up.push(
		executeKyselyDbStatement(
			`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${newDefaultValueAndHash.hash}'`,
		),
	);

	const down = [
		executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
				oldDefaultValueAndHash.value ?? "",
			)}))`,
		),
	];

	down.push(
		executeKyselyDbStatement(
			`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${oldDefaultValueAndHash.hash}'`,
		),
	);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultChange,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: up,
		down: down,
	};
	return changeset;
}
