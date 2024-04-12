import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../../../../changeset/helpers.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../../../../introspection/introspection.js";

export function CheckMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	schemaName: string,
) {
	if (istCreateFirstCheck(diff)) {
		return createFirstCheckMigration(diff, addedTables, schemaName);
	}
	if (isDropAllChecks(diff)) {
		return dropAllChecksMigration(diff, droppedTables, schemaName);
	}
	if (isCreateCheck(diff)) {
		return createCheckMigration(diff, schemaName);
	}
	if (isDropCheck(diff)) {
		return dropCheckMigration(diff, schemaName);
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

function createFirstCheckMigration(
	diff: CreateFirstCheckDiff,
	addedTables: string[],
	schemaName: string,
) {
	const tableName = diff.path[1];
	const indexNames = Object.keys(diff.value) as Array<keyof typeof diff.value>;
	return indexNames
		.flatMap((checkName) => {
			const check = diff.value[checkName]?.split(":");
			if (check !== undefined) {
				const changeSet: Changeset = {
					priority: MigrationOpPriority.ConstraintCreate,
					tableName: tableName,
					type: ChangeSetType.CreateConstraint,
					up: addCheckWithSchemaStatements(
						schemaName,
						tableName,
						checkName,
						check,
					),
					down: addedTables.includes(tableName)
						? [[]]
						: [
								dropCheckKyselySchemaStatement(
									schemaName,
									tableName,
									checkName,
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
	droppedTables: string[],
	schemaName: string,
) {
	const tableName = diff.path[1];
	const checkNames = Object.keys(diff.oldValue) as Array<
		keyof typeof diff.oldValue
	>;
	return checkNames
		.flatMap((checkName) => {
			const check = diff.oldValue[checkName]?.split(":");
			if (check !== undefined) {
				const changeSet: Changeset = {
					priority: MigrationOpPriority.ConstraintDrop,
					tableName: tableName,
					type: ChangeSetType.DropConstraint,
					up: droppedTables.includes(tableName)
						? [[]]
						: [
								dropCheckKyselySchemaStatement(
									schemaName,
									tableName,
									checkName,
								),
							],
					down: addCheckWithDbStatements(
						schemaName,
						tableName,
						checkName,
						check,
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

function createCheckMigration(diff: CreateCheck, schemaName: string) {
	const tableName = diff.path[1];
	const checkName = diff.path[2];
	const check = diff.value.split(":");

	const changeSet: Changeset = {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: addCheckWithSchemaStatements(schemaName, tableName, checkName, check),
		down: [dropCheckKyselySchemaStatement(schemaName, tableName, checkName)],
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

function dropCheckMigration(diff: DropCheck, schemaName: string) {
	const tableName = diff.path[1];
	const checkName = diff.path[2];
	const check = diff.oldValue.split(":");
	const changeSet: Changeset = {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: [dropCheckKyselySchemaStatement(schemaName, tableName, checkName)],
		down: addCheckWithDbStatements(schemaName, tableName, checkName, check),
	};
	return changeSet;
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
	checkName: string,
	check: string[],
) {
	return [
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" ADD CONSTRAINT "${checkName}" ${check[1]} NOT VALID`,
		),
		executeKyselyDbStatement(
			`COMMENT ON CONSTRAINT "${checkName}" ON "${schemaName}"."${tableName}" IS '${check[0]}'`,
		),
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" VALIDATE CONSTRAINT "${checkName}"`,
		),
	];
}

function addCheckWithSchemaStatements(
	schemaName: string,
	tableName: string,
	checkName: string,
	check: string[],
) {
	return [
		[
			[
				`await sql\`\${sql.raw(`,
				`  db`,
				`    .withSchema("${schemaName}")`,
				`    .schema.alterTable("${tableName}")`,
				`    .addCheckConstraint("${checkName}", sql\`${check[1]}\`)`,
				`    .compile()`,
				`    .sql.concat(" not valid")`,
				`)}\`.execute(db);`,
			].join("\n"),
		],
		executeKyselyDbStatement(
			`COMMENT ON CONSTRAINT "${checkName}" ON "${schemaName}"."${tableName}" IS '${check[0]}'`,
		),
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" VALIDATE CONSTRAINT "${checkName}"`,
		),
	];
}
