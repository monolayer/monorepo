import diff, { Difference } from "microdiff";
import { ColumnInfo } from "./info.js";

export type ColumnsInfo = Record<string, ColumnInfo>;
export type TableInfo = Record<string, ColumnsInfo>;

type BaseColumnChange = {
	tableName: string;
	columnName: string;
};

type RenameColumnChange = BaseColumnChange & {
	change: "renameFrom";
	value: string;
	oldValue: string;
};

type DataTypeColumnChange = BaseColumnChange & {
	change: "dataType";
	value: string;
	oldValue: string;
};

type ConstraintDefaultColumnChange = BaseColumnChange & {
	change: "default";
	value: string | undefined;
	oldValue: string | undefined;
};

type ConstraintNullableColumnChange = BaseColumnChange & {
	change: "isNullable";
	value: boolean;
	oldValue: boolean;
};

type ColumnChange =
	| RenameColumnChange
	| DataTypeColumnChange
	| ConstraintDefaultColumnChange
	| ConstraintNullableColumnChange;

export type TableChangeResult = {
	[key: string]: ColumnChange[];
};

type ColumnDifferenceChange = {
	type: "CHANGE";
	path: [string, string, string];
	value?: string | boolean;
	oldValue?: string | boolean;
};

type ColumnDifferenceChangeNullable = {
	type: "CHANGE";
	path: [string, string, string];
	value: boolean;
	oldValue: boolean;
};

type ColumnDifferenceChangeDefault = {
	type: "CHANGE";
	path: [string, string, string];
	value?: string;
	oldValue?: string;
};

type ColumnDifferenceDataType = {
	type: "CHANGE";
	path: [string, string, string];
	value: string;
	oldValue: string;
};

type ColumnDifferenceRename = {
	type: "CHANGE";
	path: [string, string, string];
	value: string;
	oldValue: string;
};

export function tableDiff(local: TableInfo, db: TableInfo) {
	return diff(local, db);
}

export function addedTables(difference: Difference[]) {
	return difference.reduce<TableInfo>((acc, tdiff) => {
		if (tdiff.type === "CREATE" && tdiff.path.length === 1) {
			acc[tdiff.path.toString()] = tdiff.value;
		}
		return acc;
	}, {});
}

export function removedTables(difference: Difference[]) {
	return difference.reduce<TableInfo>((acc, tdiff) => {
		if (tdiff.type === "REMOVE" && tdiff.path.length === 1) {
			acc[tdiff.path.toString()] = tdiff.oldValue;
		}
		return acc;
	}, {});
}

export function changeTables(local: TableInfo, db: TableInfo) {}

export class TableDiff {
	#local: TableInfo;
	#db: TableInfo;

	constructor(local: TableInfo, db: TableInfo) {
		this.#local = local;
		this.#db = db;
	}

	calculate() {
		const tableDiff = diff(this.#db, this.#local);
		const added = this.#addedTables(tableDiff);
		const removed = this.#removedTables(tableDiff);
		return {
			add: added || [],
			remove: removed || [],
			change: this.#tablesToChange(added, removed),
		};
	}

	#addedTables(difference: Difference[]) {
		const toAdd = difference.reduce((acc, tdiff) => {
			if (tdiff.type === "CREATE" && tdiff.path.length === 1) {
				acc[tdiff.path.toString()] = tdiff.value;
			}
			return acc;
		}, {} as TableInfo);
		if (Object.keys(toAdd).length !== 0) return toAdd;
	}

	#removedTables(difference: Difference[]) {
		const toRemove = difference.reduce((acc, tdiff) => {
			if (tdiff.type === "REMOVE" && tdiff.path.length === 1) {
				acc[tdiff.path.toString()] = tdiff.oldValue;
			}
			return acc;
		}, {} as TableInfo);
		if (Object.keys(toRemove).length !== 0) return toRemove;
	}

	#tablesToChange(
		added: TableInfo | undefined,
		removed: TableInfo | undefined,
	) {
		const discard = [
			...Object.keys(added || {}),
			...Object.keys(removed || {}),
		];

		const local = Object.keys(this.#local).reduce((acc, key) => {
			if (!discard.includes(key)) {
				acc[key] = this.#local[key] || {};
			}
			return acc;
		}, {} as TableInfo);

		const db = Object.keys(this.#db).reduce((acc, key) => {
			if (!discard.includes(key)) {
				acc[key] = this.#db[key] || {};
			}
			return acc;
		}, {} as TableInfo);

		const differenceChanges = diff(db, local)
			.filter((change) => change.type === "CHANGE")
			.filter(
				(change) => change.path.length === 3 && change.path[2] !== "renameFrom",
			) as ColumnDifferenceChange[];

		const allChanges = [
			...this.#dataTypeChanges(differenceChanges),
			...this.#defaultChanges(differenceChanges),
			...this.#nullableChanges(differenceChanges),
			...this.#renameChanges(differenceChanges),
		] as ColumnChange[];

		const changesByTable = allChanges.reduce((acc, change) => {
			const tableName = change.tableName;
			if (acc[tableName] === undefined) {
				acc[tableName] = [] as ColumnChange[];
			}
			const tableChanges = acc[tableName] as ColumnChange[];
			tableChanges.push(change);
			return acc;
		}, {} as TableChangeResult);
		return changesByTable;
	}

	#renameChanges(difference: ColumnDifferenceChange[]) {
		const renameChanges = difference.filter<ColumnDifferenceRename>(
			(change): change is ColumnDifferenceDataType =>
				change.path[2] === "columnName",
		);
		return renameChanges.map((change) => {
			return <RenameColumnChange>{
				tableName: change.path[0],
				columnName: change.path[1],
				change: "renameFrom",
				value: change.value,
				oldValue: change.oldValue,
			};
		});
	}

	#dataTypeChanges(difference: ColumnDifferenceChange[]) {
		const dataTypeChanges = difference.filter<ColumnDifferenceDataType>(
			(change): change is ColumnDifferenceDataType =>
				change.path[2] === "dataType",
		);
		return dataTypeChanges.map((change) => {
			return <DataTypeColumnChange>{
				tableName: change.path[0],
				columnName: change.path[1],
				change: "dataType",
				value: change.value,
				oldValue: change.oldValue,
			};
		});
	}

	#defaultChanges(difference: ColumnDifferenceChange[]) {
		const constraintChanges = difference.filter<ColumnDifferenceChangeDefault>(
			(change): change is ColumnDifferenceChangeDefault =>
				change.path[2] === "defaultValue",
		);

		return constraintChanges.map<ConstraintDefaultColumnChange>((change) => {
			return {
				tableName: change.path[0],
				columnName: change.path[1],
				change: "default",
				value: change.value,
				oldValue: change.oldValue,
			};
		});
	}

	#nullableChanges(difference: ColumnDifferenceChange[]) {
		const constraintChanges = difference.filter<ColumnDifferenceChangeNullable>(
			(change): change is ColumnDifferenceChangeNullable =>
				change.path[2] === "isNullable",
		);

		return constraintChanges.map<ConstraintNullableColumnChange>((change) => {
			return {
				tableName: change.path[0],
				columnName: change.path[1],
				change: "isNullable",
				value: change.value as boolean,
				oldValue: change.oldValue as boolean,
			};
		});
	}
}
