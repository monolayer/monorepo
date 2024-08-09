import type { Difference } from "microdiff";
import type { GeneratorContext } from "../generator-context.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangeSetType,
	MigrationOpPriority,
} from "../types.js";

export function enumMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isCreateEnum(diff)) {
		return createEnumMigration(diff, context);
	}
	if (isDropEnum(diff)) {
		return dropEnumMigration(diff, context);
	}
	if (isChangeEnum(diff)) {
		return changeEnumMigration(diff, context);
	}
}

function createEnumMigration(
	diff: CreateEnumDiff,
	{ schemaName }: GeneratorContext,
) {
	const enumName = diff.path[1];
	const enumValues = diff.value
		.split(", ")
		.map((value) => `"${value}"`)
		.join(", ");
	const changeSet: Changeset = {
		priority: MigrationOpPriority.CreateEnum,
		phase: ChangesetPhase.Expand,
		schemaName,
		tableName: "none",
		currentTableName: "none",
		type: ChangeSetType.CreateEnum,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`createType("${enumName}")`,
				`asEnum([${enumValues}])`,
			),
			executeKyselyDbStatement(
				`COMMENT ON TYPE "${schemaName}"."${enumName}" IS 'monolayer'`,
			),
		],
		down: [executeKyselySchemaStatement(schemaName, `dropType("${enumName}")`)],
	};
	return changeSet;
}

function dropEnumMigration(
	diff: DropEnumDiff,
	{ schemaName }: GeneratorContext,
) {
	const enumName = diff.path[1];
	const enumValues = diff.oldValue
		.split(", ")
		.map((value) => `"${value}"`)
		.join(", ");
	const changeSet: Changeset = {
		priority: MigrationOpPriority.DropEnum,
		phase: ChangesetPhase.Contract,
		schemaName,
		tableName: "none",
		currentTableName: "none",
		type: ChangeSetType.DropEnum,
		up: [executeKyselySchemaStatement(schemaName, `dropType("${enumName}")`)],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`createType("${enumName}")`,
				`asEnum([${enumValues}])`,
			),
			executeKyselyDbStatement(
				`COMMENT ON TYPE "${schemaName}"."${enumName}" IS 'monolayer'`,
			),
		],
	};
	return changeSet;
}

function changeEnumMigration(
	diff: ChangeEnumDiff,
	{ schemaName }: GeneratorContext,
) {
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
		priority: MigrationOpPriority.ChangeEnum,
		phase: ChangesetPhase.Expand,
		schemaName,
		tableName: "none",
		currentTableName: "none",
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
