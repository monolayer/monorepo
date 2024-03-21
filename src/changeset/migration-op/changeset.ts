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
}

export type Changeset = {
	tableName: string;
	type: ChangeSetType;
	up: string[][];
	down: string[][];
	priority: number;
};
