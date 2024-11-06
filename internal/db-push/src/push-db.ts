import type { AnySchema } from "@monorepo/pg/schema/schema.js";
import { dumpDatabase } from "@monorepo/programs/database/dump-database.js";
import { generatePrisma } from "@monorepo/programs/generate-prisma.js";
import { validateForeignKeyReferences } from "@monorepo/programs/validate-foreign-key-references.js";
import { validateUniqueSchemaName } from "@monorepo/programs/validate-unique-schema-name.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	appEnvironment,
	appEnvironmentConfigurationSchemas,
} from "@monorepo/state/app-environment.js";
import { hashValue } from "@monorepo/utils/hash-value.js";
import { gen, tryPromise } from "effect/Effect";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import ora from "ora";
import color from "picocolors";
import { codeChangesetByPhase } from "~db-push/changeset/code-changeset-by-phase.js";
import {
	computeChangeset,
	dropSchemaChangeset,
} from "~db-push/changeset/compute-changeset.js";
import { computeExtensionChangeset } from "~db-push/changeset/extension-changeset.js";
import { tableColumnRenamePrompt } from "~db-push/prompts/table-column-rename.js";
import {
	PromptState,
	updatePromptStateWithUnexecutedColumnRenames,
	updatePromptStateWithUnexecutedRenames,
} from "~db-push/state/prompt.js";
import {
	RenameState,
	type ColumnsToRename,
	type ColumnToRename,
	type Renames,
	type TableToRename,
} from "~db-push/state/rename.js";
import {
	introspectSchema,
	type SchemaIntrospection,
} from "./introspect-schema.js";
import {
	PushMigrator,
	type MigrationsByPhase,
} from "./migrator/push-migrator.js";
import { syncRenames } from "./migrator/renames.js";

export function pushDb(prompt: boolean) {
	return gen(function* () {
		yield* validateUniqueSchemaName;
		const allSchemas = yield* appEnvironmentConfigurationSchemas;

		yield* introspectLocalSchema(allSchemas, prompt);
		const introspections = yield* introspectDatabaseSchema(allSchemas);

		yield* validateSchemas(allSchemas);
		const byPhase = yield* computeChangesets(introspections, allSchemas);
		if (byPhase === undefined) {
			console.log("\nNo changes to push.");
			return true;
		}
		const result = yield* pushMigrations(byPhase);
		if (result) {
			if (prompt) {
				yield* dumpRenames;
			} else {
				yield* updatePromptState;
			}
		}
		yield* dumpDatabase;
		if ((yield* appEnvironment).currentDatabase.generatePrismaSchema) {
			yield* generatePrisma;
		}
		return result;
	});
}

function introspectLocalSchema(allSchemas: AnySchema[], prompt: boolean) {
	return gen(function* () {
		const introspections: SchemaIntrospection[] = [];
		const spinner = ora();
		spinner.start("Introspect local schema");
		let start = performance.now();
		for (const schema of allSchemas) {
			introspections.push(yield* introspectSchema(schema));
		}
		let end = performance.now();
		spinner.succeed(
			`Introspect local schema ${color.gray(`${Number(end - start).toFixed(3)}ms`)}`,
		);

		let renames: Renames = {};
		if (prompt) {
			const currentRenames = yield* RenameState.current;
			if (currentRenames.tables === undefined) {
				renames = yield* tableColumnRenamePrompt(introspections);
			} else {
				renames = currentRenames;
			}
		} else {
			renames = yield* updateRenamesWithExisiting(introspections);
		}
		yield* RenameState.update(renames);
	});
}

function updateRenamesWithExisiting(introspections: SchemaIntrospection[]) {
	return gen(function* () {
		const promptRenames = yield* RenameState.current;
		const renames = introspections.reduce<Required<Renames>>(
			(acc, entry) => {
				const renames = syncRenames(entry.local.table, entry.remote.table, [
					...(promptRenames.tables ?? []),
					...Object.values(promptRenames.columns ?? {}).flatMap((v) => v),
				]);
				acc.tables?.push(...renames.tables);
				for (const key of Object.keys(renames.columns)) {
					acc.columns[key as keyof typeof acc.columns] =
						renames.columns[key as keyof typeof renames.columns] ?? [];
				}
				return acc;
			},
			{ tables: [], columns: {} },
		);

		return renames;
	});
}
function introspectDatabaseSchema(allSchemas: AnySchema[]) {
	return gen(function* () {
		const introspections: SchemaIntrospection[] = [];
		const spinner = ora();
		spinner.start("Introspect database schema");
		const start = performance.now();
		for (const schema of allSchemas) {
			introspections.push(
				yield* introspectSchema(schema, yield* RenameState.current),
			);
		}
		const end = performance.now();
		spinner.succeed(
			`Introspect database schema ${color.gray(`${Number(end - start).toFixed(3)}ms`)}`,
		);
		return introspections;
	});
}

function validateSchemas(allSchemas: AnySchema[]) {
	return gen(function* () {
		const spinner = ora();
		spinner.start("Validate schema");
		const start = performance.now();
		for (const schema of allSchemas) {
			yield* validateForeignKeyReferences(schema, allSchemas);
		}
		const end = performance.now();
		spinner.succeed(
			`Validate schema ${color.gray(`${Number(end - start).toFixed(3)}ms`)}`,
		);
	});
}

function computeChangesets(
	introspections: SchemaIntrospection[],
	allSchemas: AnySchema[],
) {
	return gen(function* () {
		const spinner = ora();
		spinner.start("Computing changes");
		const start = performance.now();
		const changeset = [
			...(yield* computeExtensionChangeset),
			...(yield* computeChangeset(introspections, true)),
			...(yield* dropSchemaChangeset(allSchemas)),
		];
		let returnValue: Required<MigrationsByPhase> | undefined = undefined;
		if (changeset.length !== 0) {
			returnValue = codeChangesetByPhase(changeset);
		}
		const end = performance.now();
		spinner.succeed(
			`Computing changes ${color.gray(`${Number(end - start).toFixed(3)}ms`)}`,
		);
		return returnValue;
	});
}

function pushMigrations(migrationsByPhase: Required<MigrationsByPhase>) {
	return gen(function* () {
		const dbClients = yield* DbClients;
		const pushMigrator = new PushMigrator({
			db: dbClients.kysely,
		});
		return yield* tryPromise(() => pushMigrator.push(migrationsByPhase));
	});
}

const dumpRenames = gen(function* () {
	yield* dumpTableRenames;
	yield* dumpColumnRenames;
});

const dumpTableRenames = gen(function* () {
	const appEnv = yield* appEnvironment;
	const tableRenames = (yield* RenameState.current).tables;
	if (tableRenames !== undefined && tableRenames.length !== 0) {
		const tableRenameStatePath = path.join(
			appEnv.currentWorkingDir ?? cwd(),
			"monolayer",
			"state",
			"table-renames",
		);
		mkdirSync(tableRenameStatePath, { recursive: true });
		const promptState = new PromptState((yield* DbClients).kyselyNoCamelCase);
		yield* tryPromise(() => promptState.ensureTableExists());
		for (const record of tableRenameRecords(tableRenames)) {
			writeFileSync(
				path.join(tableRenameStatePath, `${record.name}.json`),
				JSON.stringify(record, null, 2),
			);
			yield* tryPromise(() => promptState.createTableRename(record.name));
		}
	}
});

const dumpColumnRenames = gen(function* () {
	const appEnv = yield* appEnvironment;
	const columnRenames = (yield* RenameState.current).columns;
	if (columnRenames !== undefined && Object.keys(columnRenames).length !== 0) {
		const columnRenameStatePath = path.join(
			appEnv.currentWorkingDir ?? cwd(),
			"monolayer",
			"state",
			"column-renames",
		);
		mkdirSync(columnRenameStatePath, { recursive: true });
		const promptState = new PromptState((yield* DbClients).kyselyNoCamelCase);
		yield* tryPromise(() => promptState.ensureTableExists());

		for (const record of columnRenamesRecords(columnRenames)) {
			writeFileSync(
				path.join(columnRenameStatePath, `${record.name}.json`),
				JSON.stringify(record, null, 2),
			);
			yield* tryPromise(() => promptState.createColumnRename(record.name));
		}
	}
});

const updatePromptState = gen(function* () {
	yield* updatePromptStateWithUnexecutedRenames;
	yield* updatePromptStateWithUnexecutedColumnRenames;
});

export function tableRenameRecords(tablesToRename: TableToRename[]) {
	return tablesToRename.map((tableToRename) => {
		const [schemaFrom, tableFrom] = tableToRename.from.split(".");
		const [_, tableTo] = tableToRename.to.split(".");
		const timestamp = new Date().toISOString().replace(/[-:T\.Z]/g, "");
		const tableRename: TableToRename = {
			name: `${timestamp}-${hashValue(
				`tableRename-${schemaFrom}-${tableFrom}-${tableFrom}-${tableTo}`,
			)}`,
			type: "tableRename",
			schema: schemaFrom!,
			table: tableFrom!,
			from: tableFrom!,
			to: tableTo!,
		};
		return tableRename;
	});
}

export function columnRenamesRecords(columnsToRename: ColumnsToRename) {
	return Object.entries(columnsToRename).reduce<ColumnToRename[]>(
		(acc, [qualifiedTableName, renames]) => {
			const [schema, table] = qualifiedTableName.split(".");
			for (const rename of renames) {
				const timestamp = new Date().toISOString().replace(/[-:T\.Z]/g, "");
				const columnRename: ColumnToRename = {
					name: `${timestamp}-${hashValue(
						`columnRename-${schema}-${table}-${rename.from}-${rename.to}`,
					)}`,
					type: "columnRename",
					schema: schema!,
					table: table!,
					from: rename.from,
					to: rename.to,
				};
				acc.push(columnRename);
			}
			return acc;
		},
		[],
	);
}
