import diff from "microdiff";
import { ColumnInfo } from "~/database/change_set/info.js";
import {
	ColumnChangeDifference,
	ColumnCreateDifference,
	ColumnDropDifference,
	ColumnsInfo,
	DbDiff,
	DbTableInfo,
	LocalTableInfo,
	TableCreateDifference,
	TableDropDifference,
	dbDiff,
	indexDiff,
	isIndexCreateifference,
	isIndexRemoveDifference,
	isTableCreateDifference,
	isTableDropDifference,
} from "./change_set/diff.js";

export enum ChangeSetType {
	CreateTable = "create",
	DropTable = "drop",
	ChangeTable = "change",
	CreateIndex = "createIndex",
	DropIndex = "dropIndex",
}

export type Changeset = {
	tableName: string;
	type: ChangeSetType;
	up: string[];
	down: string[];
};

export type TableChangeSet = {
	columns?: Changeset;
	indexes: Changeset[];
};

export type DbChangeset = Record<string, TableChangeSet>;

export function dbChangeset(local: LocalTableInfo, db: DbTableInfo) {
	const columnDiff = dbDiff(local, db);
	const indexDiff = tableIndexChangeset(local, db, columnDiff);
	const tableChangeset = {
		...tableDifferenceChangeset(columnDiff.added, indexDiff),
		...tableDifferenceChangeset(columnDiff.removed, indexDiff),
		...columnDifferenceChangeset(columnDiff.changed, indexDiff),
	};
	const tablesNames = Object.keys(tableChangeset) as Array<
		keyof typeof tableChangeset
	>;
	const filtered = [
		...indexDiff.removed,
		...indexDiff.added,
	].reduce<DbChangeset>((acc, changeset) => {
		if (!tablesNames.includes(changeset.tableName)) {
			let current = acc[changeset.tableName];
			if (current === undefined) {
				current = {
					columns: undefined,
					indexes: [changeset],
				};
			} else {
				current.indexes.push(changeset);
			}
			acc[changeset.tableName] = current;
		}
		return acc;
	}, {});

	return {
		...tableChangeset,
		...filtered,
	};
}

function tableDifferenceChangeset(
	difference: (TableCreateDifference | TableDropDifference)[],
	indexChangeSet: {
		added: Changeset[];
		removed: Changeset[];
	},
) {
	return difference.reduce<DbChangeset>((acc, tableDifference) => {
		const tableName = tableDifference.path[0];

		if (isTableCreateDifference(tableDifference)) {
			acc[tableName] = {
				columns: {
					tableName: tableName,
					type: ChangeSetType.CreateTable,
					...tableCreateMigrationOp(tableDifference),
				},
				indexes: indexChangeSet.added.filter(
					(changeset) => changeset.tableName === tableName,
				),
			};
		} else if (isTableDropDifference(tableDifference)) {
			acc[tableName] = {
				columns: {
					tableName: tableName,
					type: ChangeSetType.DropTable,
					...tableDropMigrationOp(tableDifference),
				},
				indexes: indexChangeSet.removed.filter(
					(changeset) => changeset.tableName === tableName,
				),
			};
		}
		return acc;
	}, {} as DbChangeset);
}

function columnDifferenceChangeset(
	difference: Record<
		string,
		(ColumnCreateDifference | ColumnDropDifference | ColumnChangeDifference)[]
	>,
	indexChangeSet: {
		added: Changeset[];
		removed: Changeset[];
	},
) {
	return Object.entries(difference).reduce<DbChangeset>(
		(acc, [tableName, columnDifferences]) => {
			const columnOps = columnOperations(columnDifferences);
			const migrationOp: Changeset = {
				tableName: tableName,
				type: ChangeSetType.ChangeTable,
				up: [],
				down: [],
			};

			for (const columnOp of columnOps) {
				migrationOp.up.push(columnOp.up);
				migrationOp.down.unshift(columnOp.down);
			}

			if (migrationOp.down.length !== 0) {
				migrationOp.up.unshift(`alterTable("${tableName}")`);
				migrationOp.down.unshift(`alterTable("${tableName}")`);
				acc[tableName] = {
					columns: migrationOp,
					indexes: [...indexChangeSet.added, ...indexChangeSet.removed].filter(
						(changeset) => changeset.tableName === tableName,
					),
				};
			}
			return acc;
		},
		{},
	);
}

function columnOperations(
	differences: (
		| ColumnCreateDifference
		| ColumnDropDifference
		| ColumnChangeDifference
	)[],
) {
	const columnOps: { priority: number; up: string; down: string }[] = [];
	for (const columnDiff of differences) {
		switch (columnDiff.type) {
			case "CREATE":
				columnOps.push(columnCreateMigrationOp(columnDiff));
				break;
			case "REMOVE":
				columnOps.push(columnDropMigrationOp(columnDiff));
				break;
			case "CHANGE": {
				switch (columnDiff.path[2]) {
					case "dataType":
						columnOps.push(columnDatatypeMigrationOperation(columnDiff));
						break;
					case "defaultValue":
						columnOps.push(columnDefaultMigrationOperation(columnDiff));
						break;
					case "isNullable":
						columnOps.push(columnNullableMigrationOperation(columnDiff));
						break;
					case "primaryKey":
						columnOps.push(columnPrimaryKeyMigrationOperation(columnDiff));
						break;
				}
				break;
			}
		}
	}
	columnOps.sort((a, b) => a.priority - b.priority);
	return columnOps;
}

function tableCreateMigrationOp(difference: TableCreateDifference) {
	return {
		up: [
			`createTable("${difference.path[0]}")`,
			...tableColumnsOps(difference.value),
		],
		down: [`dropTable("${difference.path[0]}")`],
	};
}

function tableDropMigrationOp(difference: TableDropDifference) {
	return {
		up: [`dropTable("${difference.path[0]}")`],
		down: [
			`createTable("${difference.path[0]}")`,
			...tableColumnsOps(difference.oldValue),
		],
	};
}

function columnCreateMigrationOp(difference: ColumnCreateDifference) {
	const columnName = difference.path[1];
	const columnDef = difference.value;

	return {
		priority: 2,
		up: `addColumn(\"${columnName}\", \"${
			columnDef.dataType
		}\"${optionsForColumn(columnDef)})`,
		down: `dropColumn(\"${columnName}\")`,
	};
}

function columnDropMigrationOp(difference: ColumnDropDifference) {
	const columnDef = difference.oldValue;
	const columnName = difference.path[1];

	return {
		priority: 2,
		up: `dropColumn(\"${columnName}\")`,
		down: `addColumn(\"${columnName}\", \"${
			columnDef.dataType
		}\"${optionsForColumn(columnDef)})`,
	};
}

function columnDatatypeMigrationOperation(diff: ColumnChangeDifference) {
	return {
		priority: 2,
		up: `alterColumn(\"${diff.path[1]}\", (col) => col.setDataType("${diff.value}"))`,
		down: `alterColumn(\"${diff.path[1]}\", (col) => col.setDataType("${diff.oldValue}"))`,
	};
}

function columnDefaultMigrationOperation(diff: ColumnChangeDifference) {
	return {
		priority: 2,
		up:
			diff.value === null
				? `alterColumn(\"${diff.path[1]}\", (col) => col.dropDefault())`
				: `alterColumn(\"${diff.path[1]}\", (col) => col.setDefault("${diff.value}"))`,
		down:
			diff.value === null
				? `alterColumn(\"${diff.path[1]}\", (col) => col.setDefault("${diff.oldValue}"))`
				: `alterColumn(\"${diff.path[1]}\", (col) => col.dropDefault())`,
	};
}

function columnNullableMigrationOperation(diff: ColumnChangeDifference) {
	return {
		priority: 2,
		up:
			diff.value === null
				? `alterColumn(\"${diff.path[1]}\", (col) => col.dropNotNull())`
				: `alterColumn(\"${diff.path[1]}\", (col) => col.setNotNull())`,
		down:
			diff.value === null
				? `alterColumn(\"${diff.path[1]}\", (col) => col.setNotNull())`
				: `alterColumn(\"${diff.path[1]}\", (col) => col.dropNotNull())`,
	};
}

function columnPrimaryKeyMigrationOperation(diff: ColumnChangeDifference) {
	return {
		priority: diff.value === null ? 1 : 1.1,
		up:
			diff.value === null
				? `dropConstraint(\"${diff.path[0]}_pk\")`
				: `alterColumn(\"${diff.path[1]}\", (col) => col.primaryKey())`,
		down:
			diff.value === null
				? `alterColumn(\"${diff.path[1]}\", (col) => col.primaryKey())`
				: `dropConstraint(\"${diff.path[0]}_pk\")`,
	};
}

function optionsForColumn(column: ColumnInfo) {
	let columnOptions = "";
	const options = [];

	if (column.isNullable === false) options.push("notNull()");
	if (column.primaryKey === true) options.push("primaryKey()");
	if (column.defaultValue !== null)
		options.push(`defaultTo(\"${column.defaultValue}\")`);
	if (options.length !== 0)
		columnOptions = `, (col) => col.${options.join(".")}`;
	return columnOptions;
}

function tableColumnsOps(columnsInfo: ColumnsInfo) {
	return Object.entries(columnsInfo).map(([_, column]) => {
		return `addColumn(\"${column.columnName}\", \"${
			column.dataType
		}\"${optionsForColumn(column)})`;
	});
}

function tableIndexChangeset(
	local: LocalTableInfo,
	db: DbTableInfo,
	dbDiff: DbDiff,
) {
	const dbIndexes = db.indexes || {};
	const droppedTables = dbDiff.removed.map((diff) => diff.path[0]);
	return indexDiff(local, db).reduce(
		(acc, tdiff) => {
			switch (tdiff.type) {
				case "CREATE": {
					if (isIndexCreateifference(tdiff)) {
						const tableName = tdiff.path[0];
						const indexName = tdiff.path[1];
						const changeSet: Changeset = {
							tableName: tableName,
							type: ChangeSetType.CreateIndex,
							up: [`await sql\`${tdiff.value}\`.execute(db);`],
							down: [`await db.schema.dropIndex("${indexName}").execute();`],
						};
						acc.added.push(changeSet);
					}
					break;
				}
				case "REMOVE": {
					if (isIndexRemoveDifference(tdiff)) {
						const tableName = tdiff.path[0] as keyof typeof dbIndexes;
						const indexName = tdiff.path[1];
						const dbIndex = dbIndexes[tableName]?.[indexName];
						if (dbIndex !== undefined) {
							const changeSet: Changeset = {
								tableName: tableName,
								type: ChangeSetType.DropIndex,
								up: droppedTables.includes(tableName)
									? []
									: [`await db.schema.dropIndex("${indexName}").execute();`],
								down: [`await sql\`${dbIndex}\`.execute(db);`],
							};
							acc.removed.push(changeSet);
						}
					}
					break;
				}
			}
			return acc;
		},
		{
			added: [] as Changeset[],
			removed: [] as Changeset[],
		},
	);
}
