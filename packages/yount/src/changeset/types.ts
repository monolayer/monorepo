export enum ChangeSetType {
	CreateTable = "createTable",
	DropTable = "dropTable",
	CreateColumn = "createColumn",
	DropColumn = "dropColumn",
	ChangeColumn = "changeColumn",
	ChangeTable = "changeTable",
	CreateIndex = "createIndex",
	DropIndex = "dropIndex",
	ChangeIndex = "changeIndex",
	CreatePrimaryKey = "createPrimaryKey",
	DropPrimaryKey = "dropPrimaryKey",
	CreateExtension = "createExtension",
	DropExtension = "dropExtension",
	CreateTrigger = "createTrigger",
	DropTrigger = "dropTrigger",
	UpdateTrigger = "updateTrigger",
	CreateEnum = "createEnum",
	DropEnum = "dropEnum",
	ChangeEnum = "changeEnum",
	ChangeColumnName = "changeColumnName",
	DropConstraint = "dropConstraint",
	CreateConstraint = "createConstraint",
	ChangeConstraint = "changeConstraint",
	CreateSchema = "createSchema",
}

export type Changeset = {
	tableName: string;
	type: ChangeSetType;
	up: string[][];
	down: string[][];
	priority: number;
};
export enum MigrationOpPriority {
	Database = 0,

	TriggerDrop = 1001,
	IndexDrop = 1002,
	ConstraintDrop = 1003,
	PrimaryKeyDrop = 1004,
	ColumnDrop = 1005,
	TableDrop = 1006,
	DropEnum = 3011,

	TableCreate = 2001,
	ColumnCreate = 2002,

	ChangeColumnDatatype = 3001,
	ChangeColumnBase = 3002,
	ChangeColumnIdentityAdd = 3009,
	ChangeColumnIdentityDrop = 3004,
	ChangeColumnDefaultAdd = 3005,
	ChangeColumnDefaultDrop = 3006,
	ChangeColumnDefaultChange = 3007,
	ChangeColumnNullable = 3008,

	ChangeColumnName = 3010,

	PrimaryKeyCreate = 4001,
	ConstraintCreate = 4002,
	IndexCreate = 4003,
	TriggerCreate = 4004,

	ChangeIndex = 5001,
	ConstraintChange = 5002,
	TriggerUpdate = 5003,
}
