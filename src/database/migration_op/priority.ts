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

	ChangeColumnDatatype = 3001,
	ChangeColumnBase = 3002,
	ChangeColumnIdentityAdd = 3003,
	ChangeColumnIdentityDrop = 3004,
	ChangeColumnDefaultAdd = 3005,
	ChangeColumnDefaultDrop = 3006,
	ChangeColumnDefaultChange = 3007,
	ChangeColumnNullable = 3008,

	ChangeColumnName = 3008,

	PrimaryKeyCreate = 4001,
	ConstraintCreate = 4002,
	IndexCreate = 4003,
	TriggerCreate = 4004,

	ChangeIndex = 5001,
	ConstraintChange = 5002,
	TriggerUpdate = 5003,
}
