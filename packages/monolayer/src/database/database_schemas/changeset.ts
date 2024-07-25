import type { Difference } from "microdiff";
import { executeKyselyDbStatement } from "~/changeset/helpers.js";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangesetPhase,
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { ChangeWarningType } from "~/changeset/warnings/types.js";

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

export type DropSchemaDiff = {
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
		phase: ChangesetPhase.Expand,
		tableName: "none",
		currentTableName: "none",
		schemaName,
		type: ChangeSetType.CreateSchema,
		up: [
			executeKyselyDbStatement(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`),
			executeKyselyDbStatement(
				`COMMENT ON SCHEMA "${schemaName}" IS 'monolayer'`,
			),
		],
		down: [executeKyselyDbStatement(`DROP SCHEMA IF EXISTS "${schemaName}";`)],
	};
	return changeset;
}

export function dropSchemaMigration(diff: DropSchemaDiff) {
	const schemaName = diff.path[1];
	const changeset: Changeset = {
		priority: MigrationOpPriority.DropSchema,
		phase: ChangesetPhase.Contract,
		tableName: "none",
		currentTableName: "none",
		schemaName,
		type: ChangeSetType.DropSchema,
		warnings: [
			{
				type: ChangeWarningType.Destructive,
				code: ChangeWarningCode.SchemaDrop,
				schema: schemaName,
			},
		],
		up: [executeKyselyDbStatement(`DROP SCHEMA IF EXISTS "${schemaName}";`)],
		down: [
			executeKyselyDbStatement(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`),
		],
	};
	return changeset;
}
