import type { Difference } from "microdiff";
import type { DbTableInfo, LocalTableInfo } from "../introspection/types.js";
import { ChangeSetType } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export function extensionMigrationOpGenerator(
	diff: Difference,
	_addedTables: string[],
	_droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isCreateExtensionDiff(diff)) {
		return createExtensionMigration(diff);
	}
	if (isDropExtensionDiff(diff)) {
		return dropExtensionMigration(diff);
	}
}

type CreateExtensionDiff = {
	type: "CREATE";
	path: ["extensions", string];
	value: boolean;
};

type DropExtensionDiff = {
	type: "REMOVE";
	path: ["extensions", string];
	oldValue: boolean;
};

function isCreateExtensionDiff(test: Difference): test is CreateExtensionDiff {
	return (
		test.type === "CREATE" &&
		test.path[0] === "extensions" &&
		test.path.length === 2 &&
		test.value !== undefined
	);
}

function isDropExtensionDiff(test: Difference): test is DropExtensionDiff {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "extensions" &&
		test.path.length === 2 &&
		test.oldValue !== undefined
	);
}

function createExtensionMigration(diff: CreateExtensionDiff) {
	const extensionName = diff.path[1];
	return {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.CreateExtension,
		up: executeKyselyDbStatement(
			`CREATE EXTENSION IF NOT EXISTS ${extensionName};`,
		),
		down: executeKyselyDbStatement(
			`DROP EXTENSION IF EXISTS ${extensionName};`,
		),
	};
}

function dropExtensionMigration(diff: DropExtensionDiff) {
	const extensionName = diff.path[1];
	return {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.DropExtension,
		up: executeKyselyDbStatement(`DROP EXTENSION IF EXISTS ${extensionName};`),
		down: executeKyselyDbStatement(
			`CREATE EXTENSION IF NOT EXISTS ${extensionName};`,
		),
	};
}