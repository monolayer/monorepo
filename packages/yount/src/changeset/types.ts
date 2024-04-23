export enum ChangeSetType {
	CreateTable = "createTable",
	DropTable = "dropTable",
	CreateColumn = "createColumn",
	DropColumn = "dropColumn",
	ChangeColumn = "changeColumn",
	ChangeTable = "changeTable",
	CreateIndex = "createIndex",
	ChangeIndex = "changeIndex",
	DropIndex = "dropIndex",
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

	IndexDrop = 800,

	ForeignKeyDrop = 810,
	UniqueConstraintDrop = 811,
	CheckConstraintDrop = 812,

	ChangeTableName = 900,

	TriggerDrop = 1001,
	PrimaryKeyDrop = 1004,
	ColumnDrop = 1005,
	TableDrop = 1006,
	DropEnum = 3011,

	TableCreate = 2001,
	ColumnCreate = 2003,

	ChangeColumnName = 3000,
	ChangeColumnDatatype = 3001,
	ChangeColumnBase = 3002,
	ChangeColumnIdentityAdd = 3009,
	ChangeColumnIdentityDrop = 3004,
	ChangeColumnDefaultAdd = 3005,
	ChangeColumnDefaultDrop = 3006,
	ChangeColumnDefaultChange = 3007,
	ChangeColumnNullable = 3008,

	PrimaryKeyCreate = 4001,

	IndexCreate = 4003,
	TriggerCreate = 4004,

	UniqueCreate = 4010,
	ForeignKeyCreate = 4011,
	CheckCreate = 4012,

	ChangeIndex = 5001,
	ConstraintChange = 5002,
	TriggerUpdate = 5003,
}
