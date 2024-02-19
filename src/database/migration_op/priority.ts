export enum MigrationOpPriority {
	Database = 0,

	TriggerDrop = 1001,
	IndexDrop = 1002,
	ConstraintDrop = 1003,
	PrimaryKeyDrop = 1004,
	ColumnDrop = 1005,
	TableDrop = 1006,

	TableCreate = 2001,
	ColumnCreate = 2002,
	PrimaryKeyCreate = 2003,
	ConstraintCreate = 2004,
	IndexCreate = 2005,
	TriggerCreate = 2006,

	ChangeColumnDatatype = 3001,
	ChangeColumnBase = 3002,
	ChangeColumnIdentityAdd = 3003,
	ChangeColumnIdentityDrop = 3004,
	ChangeColumnDefaultAdd = 3005,
	ChangeColumnDefaultDrop = 3006,
	ChangeColumnDefaultChange = 3007,
	ChangeColumnName = 3008,

	ChangeIndex = 4001,
	ConstraintChange = 4002,
	TriggerUpdate = 4003,
}
