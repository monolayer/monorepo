import { managedSchemas } from "@monorepo/pg/introspection/database-schemas.js";
import {
	introspectLocalSchema,
	renameRemoteColums,
	renameTables,
} from "@monorepo/pg/introspection/introspection/introspection.js";
import { Schema, type AnySchema } from "@monorepo/pg/schema/schema.js";
import { sortTableDependencies } from "@monorepo/programs/dependencies.js";
import { introspectAlignment } from "@monorepo/programs/introspect/alignment.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentDebug,
} from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { gen } from "effect/Effect";
import { dropSchemaChangeset as dropSchema } from "~push/changeset/generators/schema-drop.js";
import {
	schemaChangeset,
	type SchemaIntrospection,
} from "~push/changeset/schema-changeset.js";
import type { CodeChangeset } from "~push/changeset/types/changeset.js";
import { createSchemaChangeset } from "./generators/schema-create.js";
import { toSnakeCase } from "./introspection.js";
import type { CreateSchemaDiff, DropSchemaDiff } from "./types/diff.js";

export function computeChangeset(
	introspections: SchemaIntrospection[],
	performMigrationInfoRename: boolean,
	afterRename?: (introspection: SchemaIntrospection) => void,
) {
	return gen(function* () {
		let changesets: CodeChangeset[] = [];

		const typeAlignments = yield* introspectAlignment;
		for (const introspection of introspections) {
			if (performMigrationInfoRename) {
				yield* renameMigrationInfo(introspection);
				if (afterRename !== undefined) {
					afterRename(introspection);
				}
			}
			yield* sortTablePriorities(introspection);
			const changeset = yield* schemaChangeset(
				introspection,
				yield* appEnvironmentCamelCasePlugin,
				yield* appEnvironmentDebug,
				typeAlignments,
			);
			changesets = [...changesets, ...changeset];
		}
		return changesets;
	});
}

function schemaNames(schemas: AnySchema[]) {
	return gen(function* () {
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		return schemas.map((schema) =>
			toSnakeCase(Schema.info(schema).name ?? "public", camelCase),
		);
	});
}
export function generateCreateSchemaChangeset(schemas: AnySchema[]) {
	return Effect.gen(function* () {
		const schemasInDb = (yield* monolayerSchemasInDb()).map(
			(schema) => schema.name,
		);
		const localSchemas = (yield* schemaNames(schemas)).filter(
			(schemaName) => schemaName !== "public",
		);
		const schemasToCreate = localSchemas.filter(
			(schema) => !schemasInDb.includes(schema),
		);

		const changesets: CodeChangeset[] = [];

		for (const schema of schemasToCreate) {
			const diff = {
				type: "CREATE",
				path: ["schemaInfo", schema],
				value: true,
			} satisfies CreateSchemaDiff;
			const changeset = yield* createSchemaChangeset(diff);
			changesets.push(changeset);
		}
		return changesets;
	});
}

export function generateDropSchemaChangeset(schemas: AnySchema[]) {
	return Effect.gen(function* () {
		const schemasInDb = (yield* monolayerSchemasInDb()).map(
			(schema) => schema.name,
		);
		const localSchemas = (yield* schemaNames(schemas)).filter(
			(schemaName) => schemaName !== "public",
		);

		const schemasToDrop = schemasInDb.filter(
			(schema) => !localSchemas.includes(schema),
		);

		const changesets: CodeChangeset[] = [];

		for (const schema of schemasToDrop) {
			const diff = {
				type: "REMOVE",
				path: ["schemaInfo", schema],
				oldValue: true,
			} satisfies DropSchemaDiff;
			const changeset = yield* dropSchema(diff);
			changesets.push(changeset);
		}
		return changesets;
	});
}

function monolayerSchemasInDb() {
	return Effect.gen(function* () {
		const kysely = (yield* DbClients).kyselyNoCamelCase;
		return yield* Effect.tryPromise(async () => {
			const dbManagedSchemas = await managedSchemas(kysely);
			return dbManagedSchemas;
		});
	});
}

function sortTablePriorities(context: SchemaIntrospection) {
	context.tablePriorities = sortTableDependencies(
		context.remote.tablePriorities,
		context.local.tablePriorities,
		context.tablesToRename,
		context.schemaName,
	);
	return Effect.succeed(context);
}

function renameMigrationInfo(context: SchemaIntrospection) {
	return Effect.gen(function* () {
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		context.remote = renameTables(
			context.remote,
			context.tablesToRename,
			context.columnsToRename,
			context.schemaName,
		);
		context.remote.table = renameRemoteColums(
			context.remote,
			context.columnsToRename,
			context.schemaName,
		);
		context.local = introspectLocalSchema(
			context.schema,
			context.remote,
			camelCase,
			context.tablesToRename,
			context.columnsToRename,
			Schema.info(context.schema).name || "public",
			context.allSchemas,
		);
		return context;
	});
}
