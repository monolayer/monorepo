import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { executeKyselyDbStatement } from "../../changeset/helpers.js";

export function extensionMigrationOpGenerator(diff: Difference) {
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
	const changeset: Changeset = {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.CreateExtension,
		up: [
			executeKyselyDbStatement(
				`CREATE EXTENSION IF NOT EXISTS ${extensionName};`,
			),
		],
		down: [
			executeKyselyDbStatement(`DROP EXTENSION IF EXISTS ${extensionName};`),
		],
	};
	return changeset;
}

function dropExtensionMigration(diff: DropExtensionDiff) {
	const extensionName = diff.path[1];
	const changeset: Changeset = {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.DropExtension,
		up: [
			executeKyselyDbStatement(`DROP EXTENSION IF EXISTS ${extensionName};`),
		],
		down: [
			executeKyselyDbStatement(
				`CREATE EXTENSION IF NOT EXISTS ${extensionName};`,
			),
		],
	};
	return changeset;
}
