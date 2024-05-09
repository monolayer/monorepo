export type ChangeWarning = BackwardIncompatibleChange;

export enum ChangeWarningType {
	BackwardIncompatible = "backwardIncompatible",
}

export enum ChangeWarningCode {
	TableRename = "BI001",
	ColumnRename = "BI002",
}

export type BackwardIncompatibleChange =
	| TableRenameWarning
	| ColumnRenameWarning;

export type TableRenameWarning = {
	type: ChangeWarningType.BackwardIncompatible;
	code: ChangeWarningCode.TableRename;
	schema: string;
	tableRename: { from: string; to: string };
};

export type ColumnRenameWarning = {
	type: ChangeWarningType.BackwardIncompatible;
	code: ChangeWarningCode.ColumnRename;
	schema: string;
	table: string;
	columnRename: { from: string; to: string };
};
