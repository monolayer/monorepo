/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { changedColumnNames } from "~/introspection/column-name.js";
import {
	currentTableName,
	previousTableName,
} from "~/introspection/table-name.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../../../../changeset/helpers.js";
import { redefineCheck } from "./introspection.js";

export function CheckMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (istCreateFirstCheck(diff)) {
		return createFirstCheckMigration(diff, context);
	}
	if (isDropAllChecks(diff)) {
		return dropAllChecksMigration(diff, context);
	}
	if (isCreateCheck(diff)) {
		return createCheckMigration(diff, context);
	}
	if (isDropCheck(diff)) {
		return dropCheckMigration(diff, context);
	}
	if (isRehashCheck(diff, context)) {
		return rehashIndexMigration(diff, context);
	}
}

type CreateFirstCheckDiff = {
	type: "CREATE";
	path: ["checkConstraints", string];
	value: Record<string, string>;
};

function istCreateFirstCheck(test: Difference): test is CreateFirstCheckDiff {
	return (
		test.type === "CREATE" &&
		test.path[0] === "checkConstraints" &&
		test.path.length === 2
	);
}

type DropAllChecksDiff = {
	type: "REMOVE";
	path: ["checkConstraints", string];
	oldValue: Record<string, string>;
};

function isDropAllChecks(test: Difference): test is DropAllChecksDiff {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "checkConstraints" &&
		test.path.length === 2
	);
}

type RehashCheckDiff = {
	type: "CHANGE";
	path: ["checkConstraints", string, string];
	value: string;
	oldValue: string;
};

export function isRehashCheck(
	test: Difference,
	{ columnsToRename }: GeneratorContext,
): test is RehashCheckDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "checkConstraints" &&
		test.path.length === 3 &&
		typeof test.path[1] === "string" &&
		changedColumnNames(test.path[1], columnsToRename).length > 0
	);
}

function createFirstCheckMigration(
	diff: CreateFirstCheckDiff,
	{
		addedTables,
		schemaName,
		columnsToRename,
		tablesToRename,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	const checkHashes = Object.keys(diff.value) as Array<keyof typeof diff.value>;
	return checkHashes
		.flatMap((checkHash) => {
			const checkDefinition = redefineCheck(
				diff.value[checkHash]!,
				"current",
				tableName,
				columnsToRename,
			);
			if (checkDefinition !== undefined) {
				const changeSet: Changeset = {
					priority: MigrationOpPriority.CheckCreate,
					schemaName,
					tableName: tableName,
					currentTableName: currentTableName(tableName, tablesToRename),
					type: ChangeSetType.CreateCheck,
					up: addCheckWithSchemaStatements(
						schemaName,
						tableName,
						checkDefinition,
					),
					down: addedTables.includes(tableName)
						? [[]]
						: [
								dropCheckKyselySchemaStatement(
									schemaName,
									tableName,
									checkDefinition.name,
								),
							],
				};
				return changeSet;
			}
		})
		.filter((x): x is Changeset => x !== undefined);
}

function dropAllChecksMigration(
	diff: DropAllChecksDiff,
	{ droppedTables, schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const checkHashes = Object.keys(diff.oldValue) as Array<
		keyof typeof diff.oldValue
	>;
	return checkHashes
		.flatMap((checkHash) => {
			const checkDefinition = diff.oldValue[checkHash];
			if (checkDefinition !== undefined) {
				const checkName = `${previousTableName(tableName, tablesToRename)}_${checkHash}_monolayer_chk`;
				const changeSet: Changeset = {
					priority: MigrationOpPriority.CheckConstraintDrop,
					tableName: previousTableName(tableName, tablesToRename),
					currentTableName: currentTableName(tableName, tablesToRename),
					schemaName,
					type: ChangeSetType.DropCheck,
					up: droppedTables.includes(tableName)
						? [[]]
						: [
								dropCheckKyselySchemaStatement(
									schemaName,
									previousTableName(tableName, tablesToRename),
									checkName,
								),
							],
					down: addCheckWithDbStatements(
						schemaName,
						previousTableName(tableName, tablesToRename),
						{ name: checkName, definition: checkDefinition },
					),
				};
				return changeSet;
			}
		})
		.filter((x): x is Changeset => x !== undefined);
}

type CreateCheck = {
	type: "CREATE";
	path: ["checkConstraints", string, string];
	value: string;
};

function isCreateCheck(test: Difference): test is CreateCheck {
	return (
		test.type === "CREATE" &&
		test.path[0] === "checkConstraints" &&
		test.path.length === 3 &&
		typeof test.value === "string"
	);
}

function createCheckMigration(
	diff: CreateCheck,
	{ schemaName, columnsToRename, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const checkDefinition = redefineCheck(
		diff.value,
		"current",
		tableName,
		columnsToRename,
	);
	const changeSet: Changeset = {
		priority: MigrationOpPriority.CheckCreate,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename),
		type: ChangeSetType.CreateCheck,
		up: addCheckWithSchemaStatements(schemaName, tableName, checkDefinition),
		down: [
			dropCheckKyselySchemaStatement(
				schemaName,
				tableName,
				checkDefinition.name,
			),
		],
	};
	return changeSet;
}

type DropCheck = {
	type: "REMOVE";
	path: ["checkConstraints", string, string];
	oldValue: string;
};

function isDropCheck(test: Difference): test is DropCheck {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "checkConstraints" &&
		test.path.length === 3 &&
		typeof test.oldValue === "string"
	);
}

function dropCheckMigration(
	diff: DropCheck,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const checkHash = diff.path[2];
	const checkDefinition = diff.oldValue;
	const checkName = `${previousTableName(tableName, tablesToRename)}_${checkHash}_monolayer_chk`;

	const changeSet: Changeset = {
		priority: MigrationOpPriority.CheckConstraintDrop,
		schemaName,
		tableName: previousTableName(tableName, tablesToRename),
		currentTableName: currentTableName(tableName, tablesToRename),
		type: ChangeSetType.DropCheck,
		up: [
			dropCheckKyselySchemaStatement(
				schemaName,
				previousTableName(tableName, tablesToRename),
				checkName,
			),
		],
		down: addCheckWithDbStatements(
			schemaName,
			previousTableName(tableName, tablesToRename),
			{ name: checkName, definition: checkDefinition },
		),
	};
	return changeSet;
}

function rehashIndexMigration(
	diff: RehashCheckDiff,
	{ schemaName, tablesToRename, columnsToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const previousCheckName = `${previousTableName(tableName, tablesToRename)}_${diff.path[2]}_monolayer_chk`;
	const newCheckName = `${tableName}_${
		redefineCheck(diff.value, "current", tableName, columnsToRename).hash
	}_monolayer_chk`;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintChange,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename),
		type: ChangeSetType.RenameCheck,
		up: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${previousCheckName} TO ${newCheckName}`,
			),
		],
		down: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${newCheckName} TO ${previousCheckName}`,
			),
		],
	};
	return changeset;
}

function dropCheckKyselySchemaStatement(
	schemaName: string,
	tableName: string,
	checkName: string,
) {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`dropConstraint("${checkName}")`,
	);
}

function addCheckWithDbStatements(
	schemaName: string,
	tableName: string,
	check: {
		name: string;
		definition: string;
	},
) {
	return [
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" ADD CONSTRAINT "${check.name}" ${check.definition} NOT VALID`,
		),
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" VALIDATE CONSTRAINT "${check.name}"`,
		),
	];
}

function addCheckWithSchemaStatements(
	schemaName: string,
	tableName: string,
	check: {
		name: string;
		definition: string;
	},
) {
	return [
		[
			[
				`await sql\`\${sql.raw(`,
				`  db`,
				`    .withSchema("${schemaName}")`,
				`    .schema.alterTable("${tableName}")`,
				`    .addCheckConstraint("${check.name}", sql\`${check.definition}\`)`,
				`    .compile()`,
				`    .sql.concat(" not valid")`,
				`)}\`.execute(db);`,
			].join("\n"),
		],
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" VALIDATE CONSTRAINT "${check.name}"`,
		),
	];
}