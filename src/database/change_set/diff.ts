import { Kysely, PostgresDialect } from "kysely";
import diff, { Difference } from "microdiff";
import pg from "pg";
import { ColumnInfo, IndexInfo } from "~/database/change_set/info.js";
import { indexMeta, pgIndex } from "../schema/indexes.js";

export type ColumnsInfo = Record<string, ColumnInfo>;
export type TableColumnInfo = Record<string, ColumnsInfo>;
export type TableIndexInfo = Record<string, pgIndex[]>;

export type LocalTableInfo = {
	columns: TableColumnInfo;
	indexes?: Record<string, pgIndex[]>;
};

export type DbTableInfo = {
	columns: TableColumnInfo;
	indexes?: IndexInfo;
};

export type TableCreateDifference = {
	type: "CREATE";
	path: [string];
	value: ColumnsInfo;
};

export type TableDropDifference = {
	type: "REMOVE";
	path: [string];
	oldValue: ColumnsInfo;
};

export type ColumnCreateDifference = {
	type: "CREATE";
	path: [string, string];
	value: ColumnInfo;
};

export type ColumnDropDifference = {
	type: "REMOVE";
	path: [string, string];
	oldValue: ColumnInfo;
};

export type ColumnChangeDifference = {
	type: "CHANGE";
	path: [string, string, keyof ColumnInfo];
	value: string | boolean | number | null;
	oldValue: string | boolean | number | null;
};

export type IndexRemoveDifference = {
	type: "REMOVE";
	path: [string, string];
	oldValue: Record<string, string>;
};

export type IndexCreateDifference = {
	type: "CREATE";
	path: [string, string];
	value: Record<string, string>;
};

export type DbDiff = {
	added: TableCreateDifference[];
	removed: TableDropDifference[];
	changed: {
		[key: string]: (
			| ColumnChangeDifference
			| ColumnCreateDifference
			| ColumnDropDifference
		)[];
	};
};

export function isTableCreateDifference(
	test: Difference,
): test is TableCreateDifference {
	return test.path.length === 1 && test.type === "CREATE";
}

export function isTableDropDifference(
	test: Difference,
): test is TableDropDifference {
	return test.path.length === 1 && test.type === "REMOVE";
}

export function isColumnCreateDifference(
	test: Difference,
): test is ColumnCreateDifference {
	return test.path.length === 2 && test.type === "CREATE";
}

export function isColumnDropDifference(
	test: Difference,
): test is ColumnDropDifference {
	return test.path.length === 2 && test.type === "REMOVE";
}

export function isColumnChangeDifference(
	test: Difference,
): test is ColumnChangeDifference {
	return test.path.length === 3 && test.type === "CHANGE";
}

export function isIndexRemoveDifference(
	test: Difference,
): test is IndexRemoveDifference {
	return test.path.length === 2 && test.type === "REMOVE";
}

export function isIndexCreateifference(
	test: Difference,
): test is IndexCreateDifference {
	return test.path.length === 2 && test.type === "CREATE";
}

export function dbDiff(local: LocalTableInfo, db: DbTableInfo) {
	const localColumnsInfo = local.columns;
	const dbColumnsInfo = db.columns;
	const columnDiff = diff(dbColumnsInfo, localColumnsInfo).reduce<DbDiff>(
		(acc, diff) => {
			if (isTableCreateDifference(diff)) {
				acc.added.push(diff);
			} else if (isTableDropDifference(diff)) {
				acc.removed.push(diff);
			} else if (
				isColumnChangeDifference(diff) ||
				isColumnDropDifference(diff) ||
				isColumnCreateDifference(diff)
			) {
				const tableName = diff.path[0];
				const tableChanges = acc.changed[tableName];
				if (tableChanges === undefined) {
					acc.changed[tableName] = [diff];
				} else {
					tableChanges.push(diff);
				}
			}
			return acc;
		},
		{ added: [], removed: [], changed: {} },
	);
	return columnDiff;
}

export function indexDiff(local: LocalTableInfo, db: DbTableInfo) {
	const localIndexes = local.indexes || {};
	const dbIndexes = db.indexes || {};
	const [dbEn, localEnt] = normalizeEntries(localIndexes, dbIndexes);
	return diff(dbEn || {}, localEnt || {});
}

function normalizeEntries(local: Record<string, pgIndex[]>, db: IndexInfo) {
	const dbEntries = normalizeDbIndexEntries(db);
	const dbTables = Object.keys(dbEntries);
	const localEntries = normalizeLocalIndexEntries(local);
	const localTables = Object.keys(localEntries);
	for (const tableName of dbTables) {
		localEntries[tableName] = {
			...(localEntries[tableName] || {}),
		};
	}
	for (const tableName of localTables) {
		dbEntries[tableName] = {
			...(dbEntries[tableName] || {}),
		};
	}
	return [dbEntries, localEntries];
}

function normalizeLocalIndexEntries(local: Record<string, pgIndex[]>) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});

	return Object.entries(local).reduce(
		(acc, [tableName, indexes]) => {
			for (const index of indexes) {
				const meta = indexMeta(index as pgIndex);

				const compiledQuery = meta
					.builder(kysely.schema.createIndex(meta.name).on(tableName))
					.compile().sql;

				acc[tableName] = {
					...acc[tableName],
					...{ [index.name]: compiledQuery },
				};
			}
			return acc;
		},
		{} as Record<string, Record<string, string>>,
	);
}

function normalizeDbIndexEntries(db: IndexInfo) {
	return Object.entries(db).reduce(
		(acc, [tableName, indexes]) => {
			const idx = Object.entries(indexes);
			for (const index of idx) {
				acc[tableName] = {
					...acc[tableName],
					...{ [index[0]]: index[1] },
				};
			}
			return acc;
		},
		{} as Record<string, Record<string, string>>,
	);
}
