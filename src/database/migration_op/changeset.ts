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
	UpdatePrimaryKey = "updatePrimaryKey",
	CreateUniqueConstraint = "createUniqueConstraint",
	DropUniqueConstraint = "dropUniqueConstraint",
	ChangeUniqueConstraint = "changeUniqueConstraint",
	CreateForeignKeyConstraint = "createForeignKeyConstraint",
	DropForeignKeyConstraint = "dropForeignKeyConstraint",
	ChangeForeignKeyConstraint = "changeForeignKeyConstraint",
}

export type Changeset = {
	tableName: string;
	type: ChangeSetType;
	up: string[];
	down: string[];
	priority: number;
};
