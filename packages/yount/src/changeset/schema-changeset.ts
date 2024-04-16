import microdiff, { type Difference } from "microdiff";
import type { CamelCaseOptions } from "~/configuration.js";
import { type SchemaMigrationInfo } from "~/introspection/introspection.js";
import type { TablesToRename } from "~/programs/table-diff-prompt.js";
import {
	isCreateTable,
	isDropTable,
	type CreateTableDiff,
	type DropTableTableDiff,
} from "../database/schema/table/changeset.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../introspection/introspection.js";
import { buildNodes } from "../migrations/migration-schema.js";
import { migrationOpGenerators } from "./generators.js";
import { Changeset } from "./types.js";

interface Generator {
	(
		diff: Difference,
		context: GeneratorContext,
	): Changeset | Changeset[] | undefined;
}

export interface GeneratorContext {
	local: LocalTableInfo;
	db: DbTableInfo;
	addedTables: string[];
	droppedTables: string[];
	schemaName: string;
	camelCaseOptions: CamelCaseOptions;
	tablesToRename: TablesToRename;
}

export function schemaChangeset(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
	schemaName = "public",
	camelCaseOptions: CamelCaseOptions,
	tablesToRename: TablesToRename = [],
	generators: Generator[] = migrationOpGenerators,
): Changeset[] {
	const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
	const droppedTablesSortOrder = buildNodes(droppedTables, remote);
	const addedTablesSortOrder = buildNodes(addedTables, local);

	const context: GeneratorContext = {
		local: local,
		db: remote,
		addedTables: addedTables,
		droppedTables: droppedTables,
		schemaName: schemaName,
		camelCaseOptions,
		tablesToRename,
	};

	return diff
		.flatMap((difference) => {
			for (const generator of generators) {
				const op = generator(difference, context);
				if (op !== undefined) return op;
			}
			return [];
		})
		.sort((a, b) => {
			if (a.type === "dropTable") {
				const aIndex = droppedTablesSortOrder.indexOf(a.tableName);
				const bIndex = droppedTablesSortOrder.indexOf(b.tableName);
				return aIndex - bIndex;
			}
			return 1 - 1;
		})
		.sort((a, b) => {
			if (a.type === "createTable") {
				const aIndex = addedTablesSortOrder.indexOf(a.tableName);
				const bIndex = addedTablesSortOrder.indexOf(b.tableName);
				return bIndex - aIndex;
			}
			return 1 - 1;
		})
		.sort((a, b) => (a.priority || 1) - (b.priority || 1));
}

export function changesetDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const diff = microdiff(remote, local);
	const tableName = (diff: CreateTableDiff | DropTableTableDiff) =>
		diff.path[1];
	const addedTables = diff.filter(isCreateTable).map(tableName);
	const droppedTables = diff.filter(isDropTable).map(tableName);
	return {
		diff,
		addedTables,
		droppedTables,
	};
}
