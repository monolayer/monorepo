import type { EnumInfo } from "@monorepo/pg/introspection/enum.js";
import { dbExtensionInfo } from "@monorepo/pg/introspection/extension.js";
import type { IndexInfo } from "@monorepo/pg/introspection/index.js";
import type { BuilderContext } from "@monorepo/pg/introspection/introspection/foreign-key-builder.js";
import { introspectRemoteSchema } from "@monorepo/pg/introspection/introspection/introspection.js";
import type { InformationSchemaDB } from "@monorepo/pg/introspection/introspection/types.js";
import type {
	CheckInfo,
	PrimaryKeyInfo,
	UniqueInfo,
} from "@monorepo/pg/introspection/schema.js";
import type { ForeignKeyIntrospection } from "@monorepo/pg/introspection/table.js";
import type { TriggerInfo } from "@monorepo/pg/introspection/trigger.js";
import {
	createSchema,
	type ImportedSchema,
} from "@monorepo/programs/import-schemas/create-schemas.js";
import {
	checkConstraintDefinition,
	foreignKeyDefinition,
	indexDefinition,
	primaryKeyDefinition,
	triggerDefinition,
	uniqueConstraintDefinition,
} from "@monorepo/programs/import-schemas/definitions.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { camelCase } from "case-anything";
import { Effect } from "effect";
import { succeed } from "effect/Effect";
import { Kysely, PostgresDialect } from "kysely";
import { exit } from "node:process";
import pg from "pg";
import pgConnectionString from "pg-connection-string";
import color from "picocolors";
import prompts from "prompts";

export const importSchema = Effect.gen(function* () {
	const { introspection, databaseName, extensions, schemaName } =
		yield* introspectCustomRemote;

	const extensionNames = Object.keys(extensions);
	const dbSchema: ImportedSchema = {
		enums: databaseEnums(introspection.enums),
		tables: [],
		extensions:
			extensionNames.length > 0 ? databaseExtensions(extensionNames) : [],
	};

	const tableOrderIndex = introspection.tablePriorities.reverse().reduce(
		(acc, name, index) => {
			acc[name] = index;
			return acc;
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{} as Record<string, any>,
	);

	const primaryKeys = introspection.primaryKey;
	for (const tableName in introspection.table) {
		const introspectedTable =
			introspection.table[tableName as keyof typeof introspection.table]!;
		dbSchema.tables.push([
			tableName,
			{
				columns: introspectedTable.columns,
				primaryKey: tablePrimaryKey(tableName, primaryKeys),
				foreignKeys: tableForeignKeys(
					schemaName,
					tableName,
					introspection.foreignKeyDefinitions ?? {},
				),
				uniqueConstraints: tableUniqueConstraints(
					tableName,
					introspection.uniqueConstraints ?? {},
				),
				checkConstraints: tableCheckConstraints(
					tableName,
					introspection.checkConstraints ?? {},
				),
				indexes: tableIndexes(tableName, introspection.index ?? {}),
				triggers: tableTriggers(tableName, introspection.triggers ?? {}),
			},
		]);
	}

	dbSchema.tables.sort((a, b) => {
		const indexA = introspection.tablePriorities.includes(a[0])
			? tableOrderIndex[a[0]]
			: -dbSchema.tables.length;
		const indexB = introspection.tablePriorities.includes(b[0])
			? tableOrderIndex[b[0]]
			: -dbSchema.tables.length;
		return indexA - indexB;
	});

	const env = yield* appEnvironment;

	const schemaImport = createSchema(databaseName, dbSchema, env.databases);

	console.log(`${color.green(`Successfully imported ${databaseName} schema`)}`);
	console.log(`Schema file: ./${schemaImport.schema.path}`);
	console.log(
		`Configuration ${schemaImport.configuration.name} added to ./${schemaImport.configuration.path}`,
	);

	return yield* Effect.succeed(true);
});

function tablePrimaryKey(tableName: string, primaryKeys: PrimaryKeyInfo) {
	const tablePrimaryKey = primaryKeys[tableName] || {};
	if (
		Object.keys(tablePrimaryKey).length === 0 ||
		Object.keys(tablePrimaryKey).length > 1
	) {
		return undefined;
	}
	return primaryKeyDefinition(Object.values(tablePrimaryKey).at(0)!);
}

function tableForeignKeys(
	schemaName: string,
	tableName: string,
	foreignKeys: Record<string, Record<string, ForeignKeyIntrospection>>,
) {
	const tableForeignKeys = foreignKeys[tableName] || {};
	if (Object.keys(tableForeignKeys).length === 0) {
		return [];
	}

	return Object.entries(tableForeignKeys).reduce<string[]>(
		(acc, [fkHash, definition]) => {
			acc.push(foreignKeyDefinition(schemaName, tableName, fkHash, definition));
			return acc;
		},
		[],
	);
}

function tableUniqueConstraints(
	tableName: string,
	uniqueConstraints: UniqueInfo,
) {
	const tableUniqueConstraints = uniqueConstraints[tableName] || {};
	if (Object.keys(tableUniqueConstraints).length === 0) {
		return [];
	}
	const definitions = Object.values(tableUniqueConstraints);
	return definitions.map((definition) =>
		uniqueConstraintDefinition(definition),
	);
}

function tableCheckConstraints(tableName: string, checkConstraints: CheckInfo) {
	const tableCheckConstraints = checkConstraints[tableName] || {};
	if (Object.keys(tableCheckConstraints).length === 0) {
		return [];
	}
	return Object.entries(tableCheckConstraints).reduce(
		(acc, [checkName, definition]) => {
			acc.push(checkConstraintDefinition(checkName, definition));
			return acc;
		},
		[] as string[],
	);
}

function tableIndexes(tableName: string, indexes: IndexInfo) {
	const tableIndexes = indexes[tableName] || {};
	if (Object.keys(tableIndexes).length === 0) {
		return [];
	}
	return Object.entries(tableIndexes).reduce((acc, [indexName, definition]) => {
		acc.push(indexDefinition(indexName, definition));
		return acc;
	}, [] as string[]);
}

function tableTriggers(tableName: string, triggers: TriggerInfo) {
	const tableTriggers = triggers[tableName] || {};
	if (Object.keys(tableTriggers).length === 0) {
		return [];
	}
	return Object.entries(tableTriggers).reduce(
		(acc, [indexName, definition]) => {
			acc.push(triggerDefinition(indexName, definition));
			return acc;
		},
		[] as string[],
	);
}

function databaseExtensions(extensions: string[]) {
	return extensions.map((extension) => `extension("${extension}")`);
}

function databaseEnums(enums: EnumInfo) {
	return Object.entries(enums).reduce(
		(acc, [enumName, enumValues]) => {
			acc.push({
				name: camelCase(enumName),
				definition: `enumType("${enumName}", [${enumValues
					.split(",")
					.map((value) => `"${value.trimStart().trimEnd()}"`)
					.join(", ")}])`,
			});
			return acc;
		},
		[] as { name: string; definition: string }[],
	);
}

const promptConnectionString = Effect.tryPromise(async () => {
	let aborted = false;
	const connection = await prompts({
		type: "text",
		name: "string",
		message: "Enter the connection sring for the database",
		initial: "postgresql://username:password@host:post/database",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return connection.string as string;
});

const promptSchemaSelection = Effect.tryPromise(async () => {
	let aborted = false;
	const schema = await prompts({
		type: "text",
		name: "name",
		message: "Schema to import",
		initial: "public",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return schema.name as string;
});

const introspectCustomRemote = Effect.gen(function* () {
	const connectionString = yield* promptConnectionString;
	const config = pgConnectionString.parse(connectionString);
	const schemaName = yield* promptSchemaSelection;

	const kysely = yield* kyselyWithConnectionString(connectionString);

	const builderContext: BuilderContext = {
		camelCase: false,
		tablesToRename: [],
		columnsToRename: {},
		schemaName,
		external: true,
		skip: {},
	};

	const introspection = yield* Effect.tryPromise(() =>
		introspectRemoteSchema(kysely, schemaName, builderContext),
	);

	const extensions = yield* Effect.tryPromise(() =>
		dbExtensionInfo(kysely as Kysely<InformationSchemaDB>),
	);

	return {
		schemaName,
		introspection,
		databaseName: config.database!,
		connectionString,
		extensions,
	};
});

function kyselyWithConnectionString(connection_string: string) {
	const pgPool = new pg.Pool({ connectionString: connection_string });
	const kysely = new Kysely({
		dialect: new PostgresDialect({ pool: pgPool }),
	});
	return succeed(kysely);
}
