import { multiselect, select } from "@clack/prompts";
import type { Command } from "@commander-js/extra-typings";
import { Effect } from "effect";
import path from "path";
import { cliAction } from "~/cli/cli-action.js";
import { toSnakeCase } from "../../changeset/helpers.js";
import { ChangesetPhase } from "../../changeset/types.js";
import { createFile } from "../../create-file.js";
import { Schema } from "../../database/schema/schema.js";
import { introspectRemote } from "../../introspection/introspect-schemas.js";
import { dateStringWithMilliseconds } from "../../migrations/render.js";
import {
	splitColumnContractMigration,
	splitColumnDataMigration,
	splitColumnExpandMigration,
} from "../../refactor/split-column/split-column.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
	appEnvironmentMigrationsFolder,
} from "../../state/app-environment.js";
import { hashValue } from "../../utils.js";
import { cancelOperation } from "../cancel-operation.js";

export function refactorCommand(program: Command) {
	const refactor = program.command("refactor");

	refactor.description("Refactor command");

	refactor
		.command("split-column")
		.option(
			"-n, --name <configuration-name>",
			"configuration name as defined in configuration.ts",
			"default",
		)
		.option(
			"-c, --connection <connection-name>",
			"configuration connection name as defined in configuration.ts",
			"development",
		)
		.description("creates a split column refactor")
		.action(
			async (opts) =>
				await cliAction("Split Column Refactor", opts, [splitRefactor]),
		);

	return refactor;
}

export const splitRefactor = Effect.gen(function* () {
	console.log("Splitting column...");
	// Check no pending migrations

	const allSchemas = yield* appEnvironmentConfigurationSchemas;
	const schemaNames = allSchemas.map((schema) => Schema.info(schema).name);
	const selectedSchema = yield* Effect.tryPromise(() =>
		ask(schemaNames, "Select schema"),
	);
	if (typeof selectedSchema === "symbol") {
		yield* cancelOperation();
	}

	const introspectedRemote = yield* introspectRemote(
		selectedSchema as string,
		{ tablesToRename: [], columnsToRename: {} },
		false,
	);

	const tables = Object.keys(introspectedRemote.table);

	if (tables.length === 0) {
		console.error("Schema has no tables");
		return;
	}

	const selectedTable = yield* Effect.tryPromise(() =>
		ask(Object.keys(introspectedRemote.table), "Select table"),
	);

	if (typeof selectedTable === "symbol") {
		yield* cancelOperation();
	}

	const tableColumns =
		introspectedRemote.table[selectedTable as string]?.columns;

	const columnNames = Object.keys(tableColumns ?? {});

	if (!columnNames) {
		console.error("Table has no columns");
		return;
	}

	const sourceColumn = yield* Effect.tryPromise(() =>
		ask(columnNames, "Select source column"),
	);

	if (typeof sourceColumn === "symbol") {
		yield* cancelOperation();
	}

	const splitColumns = yield* Effect.tryPromise(() =>
		multiAsk(
			columnNames.filter((col) => col !== sourceColumn),
			"Select target columns",
		),
	);

	if (typeof splitColumns === "symbol") {
		yield* cancelOperation();
	}
	const folder = yield* appEnvironmentMigrationsFolder;

	const camelCasePlugin = yield* appEnvironmentCamelCasePlugin;

	const targetColumns = (splitColumns as string[]).map((col) =>
		toSnakeCase(col, camelCasePlugin),
	);

	const expandMigrationName = `${dateStringWithMilliseconds()}-split-${selectedTable as string}-${sourceColumn as string}-into-${(splitColumns as string[]).join("-")}`;
	createFile(
		path.join(folder, ChangesetPhase.Expand, `${expandMigrationName}.ts`),
		splitColumnExpandMigration.render({
			name: expandMigrationName,
			schema: selectedSchema as string,
			sourceColumn: toSnakeCase(sourceColumn as string, camelCasePlugin),
			targetColumns,
			tableName: toSnakeCase(selectedTable as string, camelCasePlugin),
			primaryKeyColumn: "id",
			columnType: "string",
			hash: hashValue(expandMigrationName),
		}),
		false,
	);

	const dataMigrationName = `${dateStringWithMilliseconds()}-split-${selectedTable as string}-${sourceColumn as string}-into-${(splitColumns as string[]).join("-")}`;
	createFile(
		path.join(folder, ChangesetPhase.Data, `${dataMigrationName}.ts`),
		splitColumnDataMigration.render({
			name: dataMigrationName,
			hash: hashValue(expandMigrationName),
			batchSize: 10000,
		}),
		false,
	);

	const contractMigrationName = `${dateStringWithMilliseconds()}-split-${selectedTable as string}-${sourceColumn as string}-into-${(splitColumns as string[]).join("-")}`;
	createFile(
		path.join(folder, ChangesetPhase.Contract, `${contractMigrationName}.ts`),
		splitColumnContractMigration.render({
			name: contractMigrationName,
			schema: selectedSchema as string,
			tableName: toSnakeCase(selectedTable as string, camelCasePlugin),
			hash: hashValue(expandMigrationName),
		}),
		false,
	);

	return yield* Effect.succeed(true);
});

export async function ask(options: string[], message: string) {
	return await select<
		{
			value: string;
			label: string;
		}[],
		string
	>({
		message: message,
		options: options.map((option) => ({
			value: option,
			label: option,
		})),
	});
}

export async function multiAsk(options: string[], message: string) {
	return await multiselect<
		{
			value: string;
			label: string;
		}[],
		string
	>({
		message: message,
		options: options.map((option) => ({
			value: option,
			label: option,
		})),
	});
}
