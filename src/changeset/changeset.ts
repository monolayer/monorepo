import microdiff, { type Difference } from "microdiff";
import type { DbTableInfo, LocalTableInfo } from "../introspection/schemas.js";
import {
	buildNodes,
	type MigrationSchema,
} from "../migrations/migration-schema.js";
import {
	isCreateTable,
	isDropTable,
	type CreateTableDiff,
	type DropTableTableDiff,
} from "../schema/table/changeset.js";
import { migrationOpGenerators } from "./generators.js";
import { Changeset } from "./types.js";

interface Generator {
	(
		diff: Difference,
		addedTables: string[],
		droppedTables: string[],
		local: LocalTableInfo,
		db: DbTableInfo,
	): Changeset | Changeset[] | undefined;
}

export function changeset(
	local: MigrationSchema,
	remote: MigrationSchema,
	generators: Generator[] = migrationOpGenerators,
): Changeset[] {
	const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
	const droppedTablesSortOrder = buildNodes(droppedTables, remote);
	const addedTablesSortOrder = buildNodes(addedTables, local);

	return diff
		.flatMap((difference) => {
			for (const generator of generators) {
				const op = generator(
					difference,
					addedTables,
					droppedTables,
					local,
					remote,
				);
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

export function changesetDiff(local: MigrationSchema, remote: MigrationSchema) {
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
