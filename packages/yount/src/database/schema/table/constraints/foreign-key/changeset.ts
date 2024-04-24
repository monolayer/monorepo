/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import {
	currentColumName,
	previousColumnName,
} from "~/introspection/column-name.js";
import {
	currentTableName,
	previousTableName,
} from "~/introspection/table-name.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~/programs/introspect-schemas.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../../../../changeset/helpers.js";
import { ForeignKeyBuilder } from "./builder.js";

export function foreignKeyMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isForeignKeyConstraintCreateFirst(diff)) {
		return createforeignKeyFirstConstraintMigration(diff, context);
	}
	if (isForeignKeyConstraintDropLast(diff)) {
		return dropforeignKeyLastConstraintMigration(diff, context);
	}
	if (isForeignKeyConstraintCreate(diff)) {
		return createForeignKeyConstraintMigration(diff, context);
	}
	if (isForeignKeyConstraintDrop(diff)) {
		return dropForeignKeyConstraintMigration(diff, context);
	}
	if (isForeignKeyNameChange(diff)) {
		return changeForeignKeyNameMigration(diff, context);
	}
}

type ForeignKeyCreateFirstDiff = {
	type: "CREATE";
	path: ["foreignKeyConstraints", string];
	value: {
		[key: string]: string;
	};
};

type ForeignKeyCreateDiff = {
	type: "CREATE";
	path: ["foreignKeyConstraints", string, string];
	value: string;
};

type ForeignKeyDropLastDiff = {
	type: "REMOVE";
	path: ["foreignKeyConstraints", string];
	oldValue: {
		[key: string]: string;
	};
};

type ForeignKeyDropDiff = {
	type: "REMOVE";
	path: ["foreignKeyConstraints", string, string];
	oldValue: string;
};

type ForeignKeyNameChangeDiff = {
	type: "CHANGE";
	path: ["foreignKeyNames", string, string];
	value: string;
	oldValue: string;
};

function isForeignKeyConstraintCreateFirst(
	test: Difference,
): test is ForeignKeyCreateFirstDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object"
	);
}

function isForeignKeyConstraintCreate(
	test: Difference,
): test is ForeignKeyCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 3 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string"
	);
}

function isForeignKeyConstraintDropLast(
	test: Difference,
): test is ForeignKeyDropLastDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object"
	);
}

function isForeignKeyConstraintDrop(
	test: Difference,
): test is ForeignKeyDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 3 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.oldValue === "string"
	);
}

function isForeignKeyNameChange(
	test: Difference,
): test is ForeignKeyNameChangeDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "foreignKeyNames" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function createforeignKeyFirstConstraintMigration(
	diff: ForeignKeyCreateFirstDiff,
	{
		schemaName,
		addedTables,
		tablesToRename,
		columnsToRename,
	}: GeneratorContext,
) {
	const tableName = currentTableName(diff.path[1], tablesToRename);
	return Object.entries(diff.value).reduce(
		(acc, [hashValue, constraintValue]) => {
			const changeset: Changeset = {
				priority: MigrationOpPriority.ForeignKeyCreate,
				schemaName,
				tableName: tableName,
				type: ChangeSetType.CreateForeignKey,
				up: addForeigKeyOps(
					tableName,
					foreignKeyDefinition(
						constraintValue,
						tableName,
						hashValue,
						tablesToRename,
						columnsToRename,
					),
					schemaName,
				),
				down: addedTables.includes(tableName)
					? [[]]
					: [
							dropForeignKeyOp(
								tableName,
								foreignKeyDefinition(
									constraintValue,
									tableName,
									hashValue,
									tablesToRename,
									columnsToRename,
								),
								schemaName,
							),
						],
			};
			acc.push(changeset);
			return acc;
		},
		[] as Changeset[],
	);
}

function createForeignKeyConstraintMigration(
	diff: ForeignKeyCreateDiff,
	{
		schemaName,
		tablesToRename,
		columnsToRename,
		camelCaseOptions,
	}: GeneratorContext,
) {
	const tableName = currentTableName(diff.path[1], tablesToRename);
	const constraintValue = diff.value;

	const builder = ForeignKeyBuilder.fromStatement(tableName, constraintValue, {
		camelCase: camelCaseOptions,
		tablesToRename,
		columnsToRename,
	});

	const foreignKeyDefinition = builder.build("current").definition;
	const changeset: Changeset = {
		priority: MigrationOpPriority.ForeignKeyCreate,
		schemaName,
		tableName: tableName,
		type: ChangeSetType.CreateForeignKey,
		up: addForeigKeyOps(tableName, foreignKeyDefinition, schemaName),
		down: [
			dropForeignKeyOp(
				currentTableName(tableName, tablesToRename),
				foreignKeyDefinition,
				schemaName,
			),
		],
	};
	return changeset;
}

function dropforeignKeyLastConstraintMigration(
	diff: ForeignKeyDropLastDiff,
	{
		schemaName,
		droppedTables,
		tablesToRename,
		columnsToRename,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	return Object.entries(diff.oldValue).reduce(
		(acc, [hashValue, constraintValue]) => {
			const changeset: Changeset = {
				priority: MigrationOpPriority.ForeignKeyDrop,
				schemaName,
				tableName: tableName,
				type: ChangeSetType.DropForeignKey,
				up: droppedTables.includes(tableName)
					? [[]]
					: [
							dropForeignKeyOp(
								tableName,
								foreignKeyDefinition(
									constraintValue,
									tableName,
									hashValue,
									tablesToRename,
									columnsToRename,
									"previous",
								),
								schemaName,
							),
						],
				down: addForeigKeyOps(
					tableName,
					foreignKeyDefinition(
						constraintValue,
						tableName,
						hashValue,
						tablesToRename,
						columnsToRename,
						"previous",
					),
					schemaName,
				),
			};
			acc.push(changeset);
			return acc;
		},
		[] as Changeset[],
	);
}

function dropForeignKeyConstraintMigration(
	diff: ForeignKeyDropDiff,
	{ schemaName, tablesToRename, columnsToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const hashValue = diff.path[2];
	const constraintValue = diff.oldValue;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ForeignKeyDrop,
		tableName: previousTableName(tableName, tablesToRename),
		schemaName,
		type: ChangeSetType.DropForeignKey,
		up: [
			dropForeignKeyOp(
				previousTableName(tableName, tablesToRename),
				foreignKeyDefinition(
					constraintValue,
					tableName,
					hashValue,
					tablesToRename,
					columnsToRename,
					"previous",
				),
				schemaName,
			),
		],
		down: addForeigKeyOps(
			previousTableName(tableName, tablesToRename),
			foreignKeyDefinition(
				constraintValue,
				tableName,
				hashValue,
				tablesToRename,
				columnsToRename,
				"previous",
			),
			schemaName,
		),
	};
	return changeset;
}

function changeForeignKeyNameMigration(
	diff: ForeignKeyNameChangeDiff,
	{ schemaName }: GeneratorContext,
) {
	const newTableAndHash = diff.value.split(":");
	const newForeignKeyName = `${newTableAndHash[0]}_${newTableAndHash[1]}_yount_fk`;
	const oldTableAndHash = diff.oldValue.split(":");
	const previousForeignKeyName = `${oldTableAndHash[0]}_${oldTableAndHash[1]}_yount_fk`;

	const tableName = newTableAndHash[0]!;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintChange,
		schemaName,
		tableName: tableName,
		type: ChangeSetType.ChangeForeignKey,
		up: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${previousForeignKeyName} TO ${newForeignKeyName}`,
			),
		],
		down: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${newForeignKeyName} TO ${previousForeignKeyName}`,
			),
		],
	};
	return changeset;
}

type ForeignKeyDefinition = {
	name: string;
	columns: string[];
	targetTable: string;
	targetColumns: string[];
	onDelete: string;
	onUpdate: string;
};

function foreignKeyDefinition(
	foreignKey: string,
	tableName: string,
	hashValue: string,
	tablesToRename: TablesToRename,
	columnsToRename: ColumnsToRename,
	mode: "current" | "previous" = "current",
) {
	const tableNameFunction =
		mode === "current" ? currentTableName : previousTableName;
	const columnNameFunction =
		mode === "current" ? currentColumName : previousColumnName;
	const target = foreignKey.match(/REFERENCES (\w+)/)?.[1] || "";
	const definition: ForeignKeyDefinition = {
		name: `${tableNameFunction(tableName, tablesToRename)}_${hashValue}_yount_fk`,
		columns: (foreignKey.match(/FOREIGN KEY \(((\w|,|\s|")+)\)/)?.[1] || "")
			.replace(/ /g, "")
			.replace(/"/g, "")
			.split(",")
			.map((col) => columnNameFunction(tableName, col, columnsToRename)),
		targetTable: tableNameFunction(target, tablesToRename),
		targetColumns: (
			foreignKey.match(/REFERENCES \w+ \(((\w|,|\s|")+)\)/)?.[1] || ""
		)
			.replace(/ /g, "")
			.replace(/"/g, "")
			.split(",")
			.map((col) =>
				columnNameFunction(
					tableNameFunction(target, tablesToRename),
					col,
					columnsToRename,
				),
			),
		onDelete:
			foreignKey
				.match(
					/ON DELETE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
				)?.[1]
				?.toLowerCase() || "",
		onUpdate:
			foreignKey
				.match(
					/ON UPDATE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
				)?.[1]
				?.toLowerCase() || "",
	};
	return definition;
}

function addForeigKeyOps(
	tableName: string,
	definition: ForeignKeyDefinition,
	schemaName: string,
) {
	const columns = definition.columns.map((col) => `"${col}"`).join(", ");
	const targetColumns = definition.targetColumns
		.map((col) => `"${col}"`)
		.join(", ");

	const ops = [
		[
			[
				`await sql\`\${sql.raw(`,
				`  db`,
				`    .withSchema("${schemaName}")`,
				`    .schema.alterTable("${tableName}")`,
				`    .addForeignKeyConstraint("${definition.name}", [${columns}], "${definition.targetTable}", [${targetColumns}])`,
				`    .onDelete("${definition.onDelete}")`,
				`    .onUpdate("${definition.onUpdate}")`,
				`    .compile()`,
				`    .sql.concat(" not valid")`,
				`)}\`.execute(db);`,
			].join("\n"),
		],
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" VALIDATE CONSTRAINT "${definition.name}"`,
		),
	];
	return ops;
}

function dropForeignKeyOp(
	tableName: string,
	definition: ForeignKeyDefinition,
	schemaName: string,
): string[] {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`dropConstraint("${definition.name}")`,
	);
}
