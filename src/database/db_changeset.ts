import diff, { Difference } from "microdiff";
import { ColumnInfo } from "~/database/change_set/column_info.js";
import { ColumnsInfo, TableInfo } from "~/database/change_set/table_diff.js";

type TableCreateDifference = {
	type: "CREATE";
	path: [string];
	value: ColumnsInfo;
};

type TableDropDifference = {
	type: "REMOVE";
	path: [string];
	oldValue: ColumnsInfo;
};

type ColumnCreateDifference = {
	type: "CREATE";
	path: [string, string];
	value: ColumnInfo;
};

type ColumnDropDifference = {
	type: "REMOVE";
	path: [string, string];
	oldValue: ColumnInfo;
};

type ColumnChangeDifference = {
	type: "CHANGE";
	path: [string, string, keyof ColumnInfo];
	value: string | boolean | number | null;
	oldValue: string | boolean | number | null;
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

enum ChangeSetType {
	CreateTable = "create",
	DropTable = "drop",
	ChangeTable = "change",
}

type CreateTableChangeSet = {
	tableName: string;
	type: ChangeSetType.CreateTable;
	up: string[];
	down: string[];
};

type DropTableChangeSet = {
	tableName: string;
	type: ChangeSetType.DropTable;
	up: string[];
	down: string[];
};

type ChangeTableChangeSet = {
	tableName: string;
	type: ChangeSetType.ChangeTable;
	up: string[];
	down: string[];
};

export type ChangeSet = (
	| CreateTableChangeSet
	| DropTableChangeSet
	| ChangeTableChangeSet
)[];

export function dbDiff(local: TableInfo, db: TableInfo) {
	return diff(db, local).reduce<DbDiff>(
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
}

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

export function dbChangeset(local: TableInfo, db: TableInfo) {
	const diff = dbDiff(local, db);
	return [
		...tableDifferenceChangeset(diff.added),
		...tableDifferenceChangeset(diff.removed),
		...columnDifferenceChangeset(diff.changed),
	];
}

function tableDifferenceChangeset(
	difference: (TableCreateDifference | TableDropDifference)[],
) {
	return difference.reduce<ChangeSet>((acc, tableDifference) => {
		const tableName = tableDifference.path[0];
		if (isTableCreateDifference(tableDifference)) {
			acc.push({
				tableName: tableName,
				type: ChangeSetType.CreateTable,
				...tableCreateMigrationOp(tableDifference),
			});
		} else if (isTableDropDifference(tableDifference)) {
			acc.push({
				tableName: tableName,
				type: ChangeSetType.DropTable,
				...tableDropMigrationOp(tableDifference),
			});
		}
		return acc;
	}, []);
}

function columnDifferenceChangeset(
	difference: Record<
		string,
		(ColumnDropDifference | ColumnCreateDifference | ColumnChangeDifference)[]
	>,
) {
	return Object.entries(difference).reduce<ChangeSet>(
		(acc, [tableName, columnDifferences]) => {
			const migrationOp = {
				tableName: tableName,
				type: ChangeSetType.ChangeTable,
				up: [] as string[],
				down: [] as string[],
			};
			for (const columnDiff of columnDifferences) {
				if (isColumnChangeDifference(columnDiff)) {
					const ops = alterColumnMigrationOp(columnDiff);
					if (ops !== undefined) {
						migrationOp.down.unshift(ops.down);
						migrationOp.up.push(ops.up);
					}
				} else if (isColumnDropDifference(columnDiff)) {
					const ops = columnDropMigrationOp(columnDiff);
					if (ops !== undefined) {
						migrationOp.down.unshift(ops.down);
						migrationOp.up.push(ops.up);
					}
				} else if (isColumnCreateDifference(columnDiff)) {
					const ops = columnCreateMigrationOp(columnDiff);
					if (ops !== undefined) {
						migrationOp.down.unshift(ops.down);
						migrationOp.up.push(ops.up);
					}
				}
			}
			if (migrationOp.down.length !== 0) {
				migrationOp.up.unshift(`alterTable("${tableName}")`);
				migrationOp.down.unshift(`alterTable("${tableName}")`);
				acc.push(migrationOp);
			}
			return acc;
		},
		[],
	);
}

function alterColumnMigrationOp(difference: ColumnChangeDifference) {
	switch (difference.path[2]) {
		case "dataType":
			return columnDatatypeMigrationOperation(difference);
		case "default":
			return columnDefaultMigrationOperation(difference);
		case "isNullable":
			return columnNullableMigrationOperation(difference);
		default:
			return undefined;
	}
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
		up: `dropColumn(\"${columnName}\")`,
		down: `addColumn(\"${columnName}\", \"${
			columnDef.dataType
		}\"${optionsForColumn(columnDef)})`,
	};
}

function columnDatatypeMigrationOperation(diff: ColumnChangeDifference) {
	return {
		up: `alterColumn(\"${diff.path[1]}\", (col) => col.setDataType("${diff.value}"))`,
		down: `alterColumn(\"${diff.path[1]}\", (col) => col.setDataType("${diff.oldValue}"))`,
	};
}

function columnDefaultMigrationOperation(diff: ColumnChangeDifference) {
	return {
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

function optionsForColumn(column: ColumnInfo) {
	let columnOptions = "";
	const options = [];

	if (column.isNullable === false) options.push("notNull()");
	if (column.default !== null) options.push(`defaultTo(\"${column.default}\")`);
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
