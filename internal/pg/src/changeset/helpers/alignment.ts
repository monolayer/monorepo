import type { ColumnInfo } from "~pg/schema/column/types.js";

export interface ColumnToAlign extends ColumnInfo {
	alignment: TypeAlignment | undefined;
}

export interface TypeAlignment {
	typname: string;
	typalign: string;
	typlen: number;
	sortCriteria: number;
	typalignBytes: number;
}

export function alignColumns(
	columns: ColumnInfo[],
	typeAlignments: TypeAlignment[],
) {
	const columnsToAlign: ColumnToAlign[] = columns.map((column) => {
		return {
			...column,
			alignment: column.enum
				? {
						typname: column.dataType,
						typalign: "i",
						typlen: 4,
						sortCriteria: 4,
						typalignBytes: 4,
					}
				: typeAlignments.find((type) => type.typname === column.dataType),
		};
	});
	return columnsToAlign.sort(alignment);
}

const alignment = (a: ColumnToAlign, b: ColumnToAlign) => {
	const aType = a.alignment;
	const bType = b.alignment;

	if (aType === undefined || bType === undefined) {
		if (aType === undefined && bType !== undefined) return 1;
		if (aType !== undefined && bType === undefined) return -1;
		if (aType === undefined && bType === undefined) {
			if (a.isNullable === b.isNullable) {
				return a.columnName!.localeCompare(b.columnName!);
			}
			return a.isNullable ? 1 : -1;
		}
		return 0;
	}

	if (aType.sortCriteria === bType.sortCriteria) {
		if (aType.typalignBytes !== bType.typalignBytes) {
			return bType.typalignBytes - aType.typalignBytes;
		}
		if (a.isNullable === b.isNullable) {
			return a.columnName!.localeCompare(b.columnName!);
		}
		return a.isNullable ? 1 : -1;
	} else {
		return bType.sortCriteria - aType.sortCriteria;
	}
};
