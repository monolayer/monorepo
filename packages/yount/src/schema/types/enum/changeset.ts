import type { Difference } from "microdiff";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "~/changeset/helpers.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../../introspection/introspection.js";

export function enumMigrationOpGenerator(
	diff: Difference,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_addedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	schemaName: string,
) {
	if (isCreateEnum(diff)) {
		return createEnumMigration(diff, schemaName);
	}
	if (isDropEnum(diff)) {
		return dropEnumMigration(diff, schemaName);
	}
	if (isChangeEnum(diff)) {
		return changeEnumMigration(diff, schemaName);
	}
}

function createEnumMigration(diff: CreateEnumDiff, schemaName: string) {
	const enumName = diff.path[1];
	const enumValues = diff.value
		.split(", ")
		.map((value) => `"${value}"`)
		.join(", ");
	const changeSet: Changeset = {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.CreateEnum,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`createType("${enumName}")`,
				`asEnum([${enumValues}])`,
			),
			executeKyselyDbStatement(
				`COMMENT ON TYPE "${schemaName}"."${enumName}" IS 'yount'`,
			),
		],
		down: [executeKyselySchemaStatement(schemaName, `dropType("${enumName}")`)],
	};
	return changeSet;
}

function dropEnumMigration(diff: DropEnumDiff, schemaName: string) {
	const enumName = diff.path[1];
	const enumValues = diff.oldValue
		.split(", ")
		.map((value) => `"${value}"`)
		.join(", ");
	const changeSet: Changeset = {
		priority: MigrationOpPriority.DropEnum,
		tableName: "none",
		type: ChangeSetType.DropEnum,
		up: [executeKyselySchemaStatement(schemaName, `dropType("${enumName}")`)],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`createType("${enumName}")`,
				`asEnum([${enumValues}])`,
			),
			executeKyselyDbStatement(
				`COMMENT ON TYPE "${schemaName}"."${enumName}" IS 'yount'`,
			),
		],
	};
	return changeSet;
}

function changeEnumMigration(diff: ChangeEnumDiff, schemaName: string) {
	const enumName = diff.path[1];
	const oldEnumValues = diff.oldValue.split(", ");
	const newValues = diff.value
		.split(", ")
		.filter((value) => value !== "")
		.filter((value) => !oldEnumValues.includes(value))
		.map(
			(value) =>
				`ALTER TYPE "${schemaName}"."${enumName}" ADD VALUE IF NOT EXISTS '${value}'`,
		);

	if (newValues.length === 0) {
		return undefined;
	}

	const changeSet: Changeset = {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.ChangeEnum,
		up: [executeKyselyDbStatement(`${newValues.join(";")};`)],
		down: [],
	};

	return changeSet;
}

type CreateEnumDiff = {
	type: "CREATE";
	path: ["enums", string];
	value: string;
};

type DropEnumDiff = {
	type: "REMOVE";
	path: ["enums", string];
	oldValue: string;
};

type ChangeEnumDiff = {
	type: "CHANGE";
	path: ["enums", string];
	value: string;
	oldValue: string;
};

function isCreateEnum(test: Difference): test is CreateEnumDiff {
	return (
		test.type === "CREATE" &&
		test.path[0] === "enums" &&
		typeof test.value === "string"
	);
}

function isDropEnum(test: Difference): test is DropEnumDiff {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "enums" &&
		typeof test.oldValue === "string"
	);
}

function isChangeEnum(test: Difference): test is ChangeEnumDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "enums" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}
