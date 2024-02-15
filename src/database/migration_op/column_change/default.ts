import {
	type Expression,
	Kysely,
	PostgresDialect,
	type RawBuilder,
	isExpression,
} from "kysely";
import { Difference } from "microdiff";
import pg from "pg";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/database/introspection/types.js";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import { executeKyselySchemaStatement } from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

export function columnDefaultMigrationOpGenerator(
	diff: Difference,
	_addedTables: string[],
	_droppedTables: string[],
	_local: LocalTableInfo,
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
	value: unknown | Expression<unknown> | null;
	oldValue: null;
};

type ColumnDefaultDropDifference = {
	type: "CHANGE";
	path: ["table", string, string, "defaultValue"];
	value: null;
	oldValue: unknown | Expression<unknown> | null;
};

type ColumnDefaultChangeDifference = {
	type: "CHANGE";
	path: ["table", string, string, "defaultValue"];
	value: unknown | Expression<unknown> | null;
	oldValue: unknown | Expression<unknown> | null;
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
	const defaultValue = compileDefault(diff.value);
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultAdd,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDefault(${defaultValue}))`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.dropDefault())`,
		),
	};
	return changeset;
}

function columnDefaultDropMigrationOperation(
	diff: ColumnDefaultDropDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const defaultValue = compileDefault(diff.oldValue);
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultDrop,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.dropDefault())`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDefault(${defaultValue}))`,
		),
	};
	return changeset;
}

function columnDefaultChangeMigrationOperation(
	diff: ColumnDefaultChangeDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const newDefaultValue = compileDefault(diff.value);
	const oldDefaultValue = compileDefault(diff.oldValue);
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultChange,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDefault(${newDefaultValue}))`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDefault(${oldDefaultValue}))`,
		),
	};
	return changeset;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function compileDefault(value: any) {
	return [
		"sql`",
		isExpression(value) ? compileDefaultExpression(value) : value,
		"`",
	].join("");
}

function compileDefaultExpression(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	expression: Expression<any>,
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const compiled = (expression as RawBuilder<any>).compile(kysely);
	return substituteSQLParameters({
		sql: compiled.sql,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		parameters: compiled.parameters as any[],
	});
}

function substituteSQLParameters(queryObject: {
	sql: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	parameters: any[];
}) {
	let { sql, parameters } = queryObject;

	// Replace each placeholder with the corresponding parameter from the array
	parameters.forEach((param, idx) => {
		// Create a regular expression for each placeholder (e.g., $1, $2)
		// Note: The backslash is escaped in the string, and '$' is escaped in the regex
		const regex = new RegExp(`\\$${idx + 1}`, "g");
		const value = typeof param === "object" ? JSON.stringify(param) : param;
		sql = sql.replace(regex, value);
	});

	return sql;
}
