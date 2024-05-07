import { Effect } from "effect";
import { mkdirSync, writeFileSync } from "fs";
import { sql, type Kysely } from "kysely";
import path from "path";
import { spinnerTask } from "~/cli/spinner-task.js";
import { databaseTableDependencies } from "~/introspection/dependencies.js";
import type { InformationSchemaDB } from "~/introspection/types.js";
import { DbClients } from "~/services/db-clients.js";
import { appEnvironment } from "~/state/app-environment.js";
import { databaseClientSettings } from "./client-settings.js";
import { databaseComments } from "./comments.js";
import { schemasDumpInfo } from "./database_schemas/introspection.js";
import {
	dbExtensionInfo,
	type ExtensionInfo,
} from "./extension/introspection.js";
import { databaseFunctions } from "./functions.js";
import { tableDumpInfo } from "./schema/table/introspection.js";
import { enumDumpInfo } from "./schema/types/enum/introspection.js";

export function dumpDatabaseStructureTask() {
	return spinnerTask("Dump database structure", () => dumpDatabase());
}

export function dumpDatabase() {
	return Effect.gen(function* () {
		const dbClients = yield* DbClients;
		const db = dbClients.currentEnvironment.kyselyNoCamelCase;
		const dumpData = yield* Effect.tryPromise(() => dump(db));
		const dumpContent = printDump(dumpData);
		const dumpPath = yield* databaseDumpPath();
		mkdirSync(path.join(path.dirname(dumpPath)), {
			recursive: true,
		});
		writeFileSync(dumpPath, dumpContent);
	});
}

interface TableDump {
	schema: string | null;
	name: string;
	table: string;
}

interface EnumDump {
	schema: string | null;
	enum: string;
	comment: string | null;
}

interface SchemaDump {
	tables: TableDump[];
	enumTypes: EnumDump[];
	comments: string[];
}

interface DumpData {
	settings: string[];
	functions: string[];
	extensions: ExtensionInfo;
	schemas: Record<string, SchemaDump>;
	migrationData: string[];
}

export async function dump(db: Kysely<InformationSchemaDB>) {
	const allSchemas = await schemasDumpInfo(db);
	const tables = await tableDumpInfo(db);
	const settings = await databaseClientSettings(db);
	const enumTypes = await enumDumpInfo(db);
	const functions = await databaseFunctions(db);
	const extensions = await dbExtensionInfo(db);
	const comments = await databaseComments(db);
	const migrationData = await kyselyMigrationData(db);

	const dumpData: DumpData = {
		settings: settings.map((setting) => setting.settings),
		functions: functions.map((func) => func.function),
		extensions: extensions,
		schemas: {} as Record<string, SchemaDump>,
		migrationData: [
			...migrationData.migrations.map((migration) => migration.migration),
			...migrationData.lock.map((lock) => lock.lock),
		],
	};

	for (const schema in allSchemas) {
		const schemaName = allSchemas[schema]?.name;
		const schemaTables = tables.filter((table) => table.schema === schemaName);
		const schemaComments = comments.filter(
			(comment) => comment.schema === schemaName,
		);
		const sortedTables = await sortTables(db, schemaName!, schemaTables);

		const schemaEnumTypes = enumTypes.filter(
			(enumType) => enumType.schema === schemaName,
		);
		dumpData.schemas[schemaName!] = {
			tables: sortedTables,
			enumTypes: schemaEnumTypes,
			comments: schemaComments.map((comment) => comment.ddl),
		};
	}
	return dumpData;
}

export function printDump(dumpData: DumpData) {
	const lines: string[] = [];

	lines.push("-- Settings");
	lines.push("");
	for (const setting of dumpData.settings) {
		lines.push(setting);
	}

	lines.push("");
	lines.push("-- Extensions");
	for (const extension in dumpData.extensions) {
		lines.push("");
		lines.push(`CREATE EXTENSION IF NOT EXISTS "${extension}";`);
	}

	lines.push("");
	lines.push("-- Functions");
	lines.push("");
	for (const func of dumpData.functions) {
		const functionLines = func
			.split("\n")
			.filter((line) => line.trim().length > 0);
		functionLines.forEach((line, idx) =>
			idx + 1 === functionLines.length
				? lines.push(`${line};`)
				: lines.push(line),
		);
		lines.push("");
	}
	lines.push("-- Schemas");
	for (const schema in dumpData.schemas) {
		lines.push("");
		const schemaData = dumpData.schemas[schema]!;
		lines.push(`-- ${schema} schema`);
		lines.push("");
		lines.push(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
		lines.push("");
		for (const enumType of schemaData.enumTypes) {
			lines.push(enumType.enum);
			if (enumType.comment !== null) {
				lines.push(enumType.comment);
			}
			lines.push("");
		}
		for (const table of schemaData.tables) {
			table.table
				.split("\n")
				.filter((line) => line.trim().length > 0)
				.map((line) => line.replace("  ", " "))
				.forEach((line) => lines.push(line));
			lines.push("");
		}
		for (const comment of schemaData.comments) {
			lines.push(comment);
		}
	}
	lines.push("");

	lines.push("-- Migration Data");
	lines.push("");
	for (const migrationData of dumpData.migrationData) {
		lines.push(migrationData);
	}
	return lines.join("\n");
}

async function sortTables(
	db: Kysely<InformationSchemaDB>,
	schema: string,
	tables: {
		schema: string | null;
		name: string;
		table: string;
	}[],
) {
	const dependencies = await databaseTableDependencies(
		db,
		schema,
		tables.map((table) => table.name),
	);

	const tableOrderIndex = dependencies.reduce(
		(acc, name, index) => {
			acc[name] = index;
			return acc;
		},
		{} as Record<string, number>,
	);

	return tables.toSorted((a, b) => {
		const indexA = tableOrderIndex[a.name] ?? -tables.length;
		const indexB = tableOrderIndex[b.name]! ?? -tables.length;
		return indexB - indexA;
	});
}

function databaseDumpPath() {
	return Effect.gen(function* () {
		const env = yield* appEnvironment;
		return path.join(
			env.folder,
			"dumps",
			env.name === "development"
				? `structure.${env.configurationName}.sql`
				: `structure_${env.name}.${env.configurationName}.sql`,
		);
	});
}

interface KyselyMigration {
	name: string;
	timestamp: string;
}

interface KyselyMigrationLock {
	id: string;
	is_locked: number;
}

interface KyselyMigrationData {
	kysely_migration: KyselyMigration;
	kysely_migration_lock: KyselyMigrationLock;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function kyselyMigrationData(db: Kysely<any>) {
	const migrations = await (db as Kysely<KyselyMigrationData>)
		.selectFrom("kysely_migration")
		.select([
			sql<string>`'INSERT INTO public.kysely_migration' || ' VALUES (' || quote_literal(kysely_migration.name) || ', ' || quote_literal(kysely_migration.timestamp) || ');'`.as(
				"migration",
			),
		])
		.orderBy("timestamp asc")
		.execute();

	const lock = await db
		.selectFrom("kysely_migration_lock")
		.select([
			sql<string>`'INSERT INTO public.kysely_migration_lock VALUES (' || quote_literal('migration_lock') || ', ' || kysely_migration_lock.is_locked || ');'`.as(
				"lock",
			),
		])
		.orderBy("id asc")
		.execute();

	return { migrations, lock };
}
