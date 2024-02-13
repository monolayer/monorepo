import type { Difference } from "microdiff";
import { ChangeSetType } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export type CreateExtensionDiff = {
	type: "CREATE";
	path: ["extensions", string];
	value: boolean;
};

export type DropExtensionDiff = {
	type: "REMOVE";
	path: ["extensions", string];
	oldValue: boolean;
};

export function isCreateExtensionDiff(
	test: Difference,
): test is CreateExtensionDiff {
	return (
		test.type === "CREATE" &&
		test.path[0] === "extensions" &&
		test.path.length === 2 &&
		test.value !== undefined
	);
}

export function isDropExtensionDiff(
	test: Difference,
): test is DropExtensionDiff {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "extensions" &&
		test.path.length === 2 &&
		test.oldValue !== undefined
	);
}

export function createExtensionMigration(diff: CreateExtensionDiff) {
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

export function dropExtensionMigration(diff: DropExtensionDiff) {
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
