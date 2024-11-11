export enum ChangeWarningCode {
	TableRename = "BI001",
	ColumnRename = "BI002",
	SchemaDrop = "D001",
	TableDrop = "D002",
	ColumnDrop = "D003",
	TriggerDrop = "D004",
	ExtensionDrop = "D005",
	ChangeColumnType = "B001",
	AddVolatileDefault = "B002",
	AddSerialColumn = "B003",
	AddBigSerialColumn = "B004",
	AddPrimaryKeyToExistingNullableColumn = "MF001",
	AddPrimaryKeyToNewColumn = "MF002",
	AddUniqueToExistingColumn = "MF003",
	AddNonNullableColumn = "MF004",
	ChangeColumnToNonNullable = "MF005",
}