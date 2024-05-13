export type ChangeWarning =
	| BackwardIncompatibleChange
	| DestructiveChange
	| BlockingChange;

export enum ChangeWarningType {
	BackwardIncompatible = "backwardIncompatible",
	Destructive = "destructive",
	Blocking = "blocking",
}

export enum ChangeWarningCode {
	TableRename = "BI001",
	ColumnRename = "BI002",
	SchemaDrop = "D001",
	TableDrop = "D002",
	ColumnDrop = "D003",
	CreatePrimaryKey = "B001",
	CreateUniqueConstraint = "B002",
	ChangeColumnType = "B003",
	ChangeColumnDefaultVolatile = "B004",
	ChangeColumnNotNullable = "B005",
	AddSerialColumn = "B006",
	AddBigSerialColumn = "B007",
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

export type DestructiveChange =
	| SchemaDropWarning
	| TableDropWarning
	| ColumnDropWarning;

export type SchemaDropWarning = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.SchemaDrop;
	schema: string;
};

export type TableDropWarning = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.TableDrop;
	schema: string;
	table: string;
};

export type ColumnDropWarning = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.ColumnDrop;
	schema: string;
	table: string;
	column: string;
};

export type BlockingChange =
	| CreatePrimaryKey
	| CreateUniqueConstraint
	| ChangeColumnType
	| ChangeColumnDefaultVolatile
	| AddSerialColumn
	| AddBigSerialColumn;

export type CreatePrimaryKey = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.CreatePrimaryKey;
	schema: string;
	table: string;
};

export type CreateUniqueConstraint = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.CreateUniqueConstraint;
	schema: string;
	table: string;
	columns: string[];
};

export type ChangeColumnType = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.ChangeColumnType;
	schema: string;
	table: string;
	column: string;
	from: string;
	to: string;
};

export type ChangeColumnDefaultVolatile = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.ChangeColumnDefaultVolatile;
	schema: string;
	table: string;
	column: string;
};

export type AddSerialColumn = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.AddSerialColumn;
	schema: string;
	table: string;
	column: string;
};

export type AddBigSerialColumn = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.AddBigSerialColumn;
	schema: string;
	table: string;
	column: string;
};
