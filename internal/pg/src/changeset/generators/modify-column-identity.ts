import { gen } from "effect/Effect";
import { Difference } from "microdiff";
import { ChangesetGeneratorState } from "~pg/changeset/changeset-generator.js";
import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import { executeKyselyDbStatement } from "~pg/changeset/helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import { currentTableName } from "~pg/introspection/introspection/table-name.js";
import type { ColumnInfo } from "~pg/schema/column/types.js";

export function columnIdentityMigrationOpGenerator(diff: Difference) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;

		if (isColumnIdentityAdd(diff)) {
			return columnIdentityAddMigrationOperation(diff, context);
		}
		if (isColumnIdentityDrop(diff)) {
			return columnIdentityDropMigrationOperation(diff, context);
		}
	});
}

type IdentityAddDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "identity"];
	value: NonNullable<ColumnInfo["identity"]>;
	oldValue: null;
};

type IdentityDropDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "identity"];
	value: null;
	oldValue: NonNullable<ColumnInfo["identity"]>;
};

function isColumnIdentityAdd(test: Difference): test is IdentityAddDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "identity" &&
		test.value !== null &&
		test.oldValue === null
	);
}

function isColumnIdentityDrop(
	test: Difference,
): test is IdentityDropDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "identity" &&
		test.value === null &&
		test.oldValue !== null
	);
}

function columnIdentityAddMigrationOperation(
	diff: IdentityAddDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnIdentityAdd,
		phase: ChangesetPhase.Alter,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.ChangeColumnGeneration,
		up:
			diff.value === "ALWAYS"
				? [
						executeKyselyDbStatement(
							`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" ADD GENERATED ALWAYS AS IDENTITY`,
						),
					]
				: [
						executeKyselyDbStatement(
							`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" ADD GENERATED BY DEFAULT AS IDENTITY`,
						),
					],
		down: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" DROP IDENTITY`,
			),
		],
	};
	return changeset;
}

function columnIdentityDropMigrationOperation(
	diff: IdentityDropDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnIdentityDrop,
		phase: ChangesetPhase.Alter,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.ChangeColumnGeneration,
		up: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" DROP IDENTITY`,
			),
		],
		down:
			diff.oldValue === "ALWAYS"
				? [
						executeKyselyDbStatement(
							`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" ADD GENERATED ALWAYS AS IDENTITY`,
						),
					]
				: [
						executeKyselyDbStatement(
							`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" ADD GENERATED BY DEFAULT AS IDENTITY`,
						),
					],
	};
	return changeset;
}
