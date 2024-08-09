import type { Difference } from "microdiff";
import microdiff from "microdiff";
import { type ExtensionInfo } from "../../introspection/extension.js";
import { executeKyselyDbStatement } from "../helpers/helpers.js";
import {
	ChangesetPhase,
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "../types.js";

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
		priority: MigrationOpPriority.CreateExtension,
		phase: ChangesetPhase.Expand,
		tableName: "none",
		currentTableName: "none",
		type: ChangeSetType.CreateExtension,
		up: [
			executeKyselyDbStatement(
				`CREATE EXTENSION IF NOT EXISTS ${extensionName};`,
			),
		],
		down: [
			executeKyselyDbStatement(`DROP EXTENSION IF EXISTS ${extensionName};`),
		],
		schemaName: null,
	};
	return changeset;
}

function dropExtensionMigration(diff: DropExtensionDiff) {
	const extensionName = diff.path[1];
	const changeset: Changeset = {
		priority: MigrationOpPriority.DropExtension,
		phase: ChangesetPhase.Contract,
		tableName: "none",
		currentTableName: "none",
		type: ChangeSetType.DropExtension,
		up: [
			executeKyselyDbStatement(`DROP EXTENSION IF EXISTS ${extensionName};`),
		],
		down: [
			executeKyselyDbStatement(
				`CREATE EXTENSION IF NOT EXISTS ${extensionName};`,
			),
		],
		schemaName: null,
	};
	return changeset;
}

export function extensionChangeset(
	local: ExtensionInfo,
	remote: ExtensionInfo,
) {
	const diff = microdiff({ extensions: remote }, { extensions: local });
	const changeset = diff.flatMap((difference) => {
		const cset = extensionMigrationOpGenerator(difference);
		if (cset !== undefined) return cset;
		return [];
	});
	return changeset;
}
