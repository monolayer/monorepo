import type { Difference } from "microdiff";
import { executeKyselyDbStatement } from "~/changeset/helpers.js";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";

export function schemaMigrationOpGenerator(
	diff: Difference,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_context: GeneratorContext,
) {
	if (isCreateSchema(diff)) {
		return createSchemaMigration(diff);
	}
	if (isDropSchema(diff)) {
		return dropSchemaMigration(diff);
	}
}

type CreateSchemaDiff = {
	type: "CREATE";
	path: ["schemaInfo", string];
	value: true;
};

type DropSchemaDiff = {
	type: "REMOVE";
	path: ["schemaInfo", string];
	oldValue: true;
};

function isCreateSchema(test: Difference): test is CreateSchemaDiff {
	return (
		test.type === "CREATE" &&
		test.path[0] === "schemaInfo" &&
		typeof test.path[1] === "string" &&
		test.value === true
	);
}

function isDropSchema(test: Difference): test is DropSchemaDiff {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "schemaInfo" &&
		typeof test.path[1] === "string" &&
		test.oldValue === true
	);
}

function createSchemaMigration(diff: CreateSchemaDiff) {
	const schemaName = diff.path[1];
	const changeset: Changeset = {
		priority: MigrationOpPriority.CreateSchema,
		tableName: "none",
		currentTableName: "none",
		schemaName,
		type: ChangeSetType.CreateSchema,
		up: [
			executeKyselyDbStatement(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`),
			executeKyselyDbStatement(`COMMENT ON SCHEMA "${schemaName}" IS 'yount'`),
		],
		down: [executeKyselyDbStatement(`DROP SCHEMA IF EXISTS "${schemaName}";`)],
	};
	return changeset;
}

function dropSchemaMigration(diff: DropSchemaDiff) {
	const schemaName = diff.path[1];
	const changeset: Changeset = {
		priority: MigrationOpPriority.DropSchema,
		tableName: "none",
		currentTableName: "none",
		schemaName,
		type: ChangeSetType.DropSchema,
		up: [executeKyselyDbStatement(`DROP SCHEMA IF EXISTS "${schemaName}";`)],
		down: [
			executeKyselyDbStatement(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`),
		],
	};
	return changeset;
}
