import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../../introspection/introspection.js";

export function enumMigrationOpGenerator(
	diff: Difference,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_addedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
) {
	if (isCreateEnum(diff)) {
		return createEnumMigration(diff);
	}
	if (isDropEnum(diff)) {
		return dropEnumMigration(diff);
	}
	if (isChangeEnum(diff)) {
		return changeEnumMigration(diff);
	}
}

function createEnumMigration(diff: CreateEnumDiff) {
	const enumName = diff.path[1];
	const enumValues = diff.value
		.split(", ")
		.map((value) => `"${value}"`)
		.join(", ");
	const changeSet: Changeset = {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.CreateEnum,
		up: [
			[
				"await db.schema",
				`createType("${enumName}")`,
				`asEnum([${enumValues}])`,
				`execute();await sql\`COMMENT ON TYPE "${enumName}" IS 'yount'\`.execute(db)`,
			],
		],
		down: [["await db.schema", `dropType("${enumName}")`, "execute();"]],
	};
	return changeSet;
}

function dropEnumMigration(diff: DropEnumDiff) {
	const enumName = diff.path[1];
	const enumValues = diff.oldValue
		.split(", ")
		.map((value) => `"${value}"`)
		.join(", ");
	const changeSet: Changeset = {
		priority: MigrationOpPriority.DropEnum,
		tableName: "none",
		type: ChangeSetType.DropEnum,
		up: [["await db.schema", `dropType("${enumName}")`, "execute();"]],
		down: [
			[
				"await db.schema",
				`createType("${enumName}")`,
				`asEnum([${enumValues}])`,
				`execute();await sql\`COMMENT ON TYPE "${enumName}" IS 'yount'\`.execute(db)`,
			],
		],
	};
	return changeSet;
}

function changeEnumMigration(diff: ChangeEnumDiff) {
	const enumName = diff.path[1];
	const oldEnumValues = diff.oldValue.split(", ");
	const newValues = diff.value
		.split(", ")
		.filter((value) => value !== "")
		.filter((value) => !oldEnumValues.includes(value))
		.map(
			(value) => `ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS '${value}'`,
		);

	if (newValues.length === 0) {
		return undefined;
	}

	const changeSet: Changeset = {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		type: ChangeSetType.ChangeEnum,
		up: [[`await sql\`${newValues.join(";")};\`.execute(db);`]],
		down: [],
	};

	return changeSet;
}

type CreateEnumDiff = {
	type: "CREATE";
	path: ["enums", string];
	value: string;
};

type DropEnumDiff = {
	type: "REMOVE";
	path: ["enums", string];
	oldValue: string;
};

type ChangeEnumDiff = {
	type: "CHANGE";
	path: ["enums", string];
	value: string;
	oldValue: string;
};

function isCreateEnum(test: Difference): test is CreateEnumDiff {
	return (
		test.type === "CREATE" &&
		test.path[0] === "enums" &&
		typeof test.value === "string"
	);
}

function isDropEnum(test: Difference): test is DropEnumDiff {
	return (
		test.type === "REMOVE" &&
		test.path[0] === "enums" &&
		typeof test.oldValue === "string"
	);
}

function isChangeEnum(test: Difference): test is ChangeEnumDiff {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "enums" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}
