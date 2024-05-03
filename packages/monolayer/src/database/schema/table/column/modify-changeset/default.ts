import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import { currentTableName } from "~/introspection/table-name.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
	sqlStatement,
} from "../../../../../changeset/helpers.js";
import { toValueAndHash } from "../../changeset-helpers.js";

export function columnDefaultMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isColumnDefaultAddValue(diff)) {
		return columnDefaultAddMigrationOperation(diff, context);
	}
	if (isColumnDefaultDropValue(diff)) {
		return columnDefaultDropMigrationOperation(diff, context);
	}
	if (isColumnDefaultChangeValue(diff)) {
		return columnDefaultChangeMigrationOperation(diff, context);
	}
}

type ColumnDefaultAddDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "defaultValue"];
	value: string;
	oldValue: null;
};

type ColumnDefaultDropDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "defaultValue"];
	value: null;
	oldValue: string;
};

type ColumnDefaultChangeDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "defaultValue"];
	value: string;
	oldValue: string;
};

function isColumnDefaultAddValue(
	test: Difference,
): test is ColumnDefaultAddDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "defaultValue" &&
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
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "defaultValue" &&
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
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "defaultValue" &&
		test.value !== null &&
		test.oldValue !== null
	);
}

function columnDefaultAddMigrationOperation(
	diff: ColumnDefaultAddDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];

	const defaultValueAndHash = toValueAndHash(String(diff.value));

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultAdd,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumn,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
					defaultValueAndHash.value ?? "",
				)}))`,
			),
			executeKyselyDbStatement(
				`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.dropDefault())`,
			),
		],
		schemaName,
	};
	return changeset;
}

function columnDefaultDropMigrationOperation(
	diff: ColumnDefaultDropDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];

	const defaultValueAndHash = toValueAndHash(String(diff.oldValue));

	executeKyselyDbStatement(
		`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
	);
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultDrop,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumn,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.dropDefault())`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
					defaultValueAndHash.value ?? "",
				)}))`,
			),
			executeKyselyDbStatement(
				`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
			),
		],
	};
	return changeset;
}

function columnDefaultChangeMigrationOperation(
	diff: ColumnDefaultChangeDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];

	const newDefaultValueAndHash = toValueAndHash(String(diff.value));
	const oldDefaultValueAndHash = toValueAndHash(String(diff.oldValue));

	if (newDefaultValueAndHash.hash === oldDefaultValueAndHash.hash) {
		return [];
	}

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
				newDefaultValueAndHash.value ?? "",
			)}))`,
		),
	];

	up.push(
		executeKyselyDbStatement(
			`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${newDefaultValueAndHash.hash}'`,
		),
	);

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
				oldDefaultValueAndHash.value ?? "",
			)}))`,
		),
	];

	down.push(
		executeKyselyDbStatement(
			`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${oldDefaultValueAndHash.hash}'`,
		),
	);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultChange,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumn,
		up: up,
		down: down,
		schemaName,
	};
	return changeset;
}
