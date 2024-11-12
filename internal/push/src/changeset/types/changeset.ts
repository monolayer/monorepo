import type { AnyKysely } from "../introspection.js";

export enum ChangesetType {
	CreateTable = "createTable",
	DropTable = "dropTable",
	CreateColumn = "createColumn",
	CreateNonNullableColumn = "createNonNullableColumn",
	DropColumn = "dropColumn",
	ChangeColumn = "changeColumn",
	ChangeColumnDataType = "changeColumnDataType",
	ChangeColumnDefault = "changeColumnDefault",
	ChangeColumnGeneration = "changeColumnGeneration",
	ChangeColumnNullable = "changeColumnNullable",
	RenameTable = "renameTable",
	CreateIndex = "createIndex",
	RenameIndex = "renameIndex",
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
	RenameColumn = "renameColumn",
	CreateForeignKey = "createForeignKey",
	DropForeignKey = "dropForeignKey",
	RenameForeignKey = "renameForeignKey",
	CreateUnique = "createUniqueConstraint",
	DropUnique = "dropUniqueConstraint",
	RenameUnique = "renameUniqueConstraint",
	CreateCheck = "createCheckConstraint",
	RenameCheck = "renameCheckConstraint",
	DropCheck = "dropCheckConstraint",
	CreateSchema = "createSchema",
	DropSchema = "dropSchema",
	RenameTableObjects = "renameTableObjects",
}

export type CodeChangeset = {
	tableName: string;
	currentTableName: string;
	type: ChangesetType;
	up: (db: AnyKysely) => Promise<void>;
	down: (db: AnyKysely) => Promise<void>;
	verify?: (db: AnyKysely) => Promise<void>;
	priority: number;
	schemaName: string | null;
	transaction?: boolean;
	warnings?: Array<CodeChangesetWarning>;
	phase: ChangesetPhase;
	transform?: SchemaTransform;
};

export type CodeChangesetWarning = { header: string; notes: string[] };

export type SchemaTransform = RenameColumnSchemaTransform;

export type RenameColumnSchemaTransform = {
	schema: string;
	table: string;
	from: string;
	to: string;
	type: "columnRename" | "tableRename";
};

export enum MigrationOpPriority {
	CreateSchema = 0,
	CreateExtension = 1,
	CreateEnum = 2,
	ChangeEnum = 3,
	IndexDrop = 800,

	ForeignKeyDrop = 810,
	UniqueConstraintDrop = 811,
	CheckConstraintDrop = 812,
	TriggerDrop = 813,
	RenameTable = 900,

	SplitColumnRefactorDrop = 1002,
	PrimaryKeyDrop = 1004,
	ColumnDrop = 1005,
	TableDrop = 1006,

	TableCreate = 2001,
	ColumnCreate = 2003,
	SplitColumnRefactor = 2004,

	ChangeColumnName = 3000,
	ChangeColumnDatatype = 3001,
	ChangeColumnBase = 3002,
	ChangeColumnIdentityDrop = 3004,
	ChangeColumnDefaultAdd = 3005,
	ChangeColumnDefaultDrop = 3006,
	ChangeColumnDefaultChange = 3007,

	ChangeColumnNullable = 3011,
	ChangeColumnIdentityAdd = 3012,

	IndexCreate = 4003,
	TriggerCreate = 4004,

	UniqueCreate = 4010,
	CheckCreate = 4012,
	PrimaryKeyCreate = 4013,
	ForeignKeyCreate = 4014,

	ChangeIndex = 5001,
	ConstraintChange = 5002,
	TriggerUpdate = 5003,
	RenameTableObjects = 5004,
	DropEnum = 6003,
	DropExtension = 6004,
	DropSchema = 6005,
}

export enum ChangesetPhase {
	Alter = "alter",
	Expand = "expand",
	Contract = "contract",
	Data = "data",
}
