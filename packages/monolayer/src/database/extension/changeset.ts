import { Effect } from "effect";
import type { Difference } from "microdiff";
import { extensionChangeset } from "~/changeset/extension-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import {
	dbExtensionInfo,
	localExtensionInfo,
	type ExtensionInfo,
} from "~/database/extension/introspection.js";
import { DbClients } from "~/services/db-clients.js";
import { appEnvironment } from "~/state/app-environment.js";
import { executeKyselyDbStatement } from "../../changeset/helpers.js";

export function extensionMigrationOpGenerator(diff: Difference) {
	if (isCreateExtensionDiff(diff)) {
		return createExtensionMigration(diff);
	}
	if (isDropExtensionDiff(diff)) {
		return dropExtensionMigration(diff);
	}
}

export function computeExtensionChangeset() {
	return Effect.all([localExtensions(), remoteExtensions]).pipe(
		Effect.flatMap(computeChangeset),
	);
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

function computeChangeset(info: [ExtensionInfo, ExtensionInfo]) {
	return Effect.succeed(extensionChangeset(info[0], info[1]));
}

function localExtensions() {
	return appEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(localExtensionInfo(environment.configuration.extensions)),
		),
	);
}

export const remoteExtensions = DbClients.pipe(
	Effect.flatMap((dbClients) =>
		Effect.tryPromise(() =>
			dbExtensionInfo(dbClients.currentEnvironment.kyselyNoCamelCase),
		),
	),
);
