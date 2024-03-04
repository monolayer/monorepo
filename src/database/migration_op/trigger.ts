import type { Difference } from "microdiff";
import type { DbTableInfo, LocalTableInfo } from "../introspection/types.js";
import { ChangeSetType, type Changeset } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export function triggerMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isTriggerCreate(diff)) {
		return createTriggerMigration(diff, addedTables);
	}
	if (isTriggerDrop(diff)) {
		return dropTriggerMigration(diff, droppedTables);
	}
	if (isTriggerChange(diff)) {
		return changeTriggerMigration(diff);
	}
}

type TriggerCreateDiff = {
	type: "CREATE";
	path: ["triggers", string];
	value: {
		[key: string]: string;
	};
};

type TriggerDropDiff = {
	type: "REMOVE";
	path: ["triggers", string];
	oldValue: {
		[key: string]: string;
	};
};

type TriggerChangeDiff = {
	type: "CHANGE";
	path: ["triggers", string, string];
	value: string;
	oldValue: string;
};

function isTriggerCreate(test: Difference): test is TriggerCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

function isTriggerDrop(test: Difference): test is TriggerDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object" &&
		Object.keys(test.oldValue).length === 1
	);
}

function isTriggerChange(test: Difference): test is TriggerChangeDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string" &&
		test.value.split(":")[0] !== test.oldValue.split(":")[0]
	);
}

function createTriggerMigration(
	diff: TriggerCreateDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	const triggerName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const triggerValue = diff.value[
		triggerName
	] as (typeof diff.value)[keyof typeof diff.value];
	const trigger = triggerValue.split(":");

	const changeset: Changeset = {
		priority: MigrationOpPriority.TriggerCreate,
		tableName: tableName,
		type: ChangeSetType.CreateTrigger,
		up: [
			executeKyselyDbStatement(
				`${trigger[1]};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${trigger[0]}';`,
			),
		],
		down: addedTables.includes(tableName)
			? [[]]
			: [
					executeKyselyDbStatement(
						`DROP TRIGGER ${triggerName} ON ${tableName}`,
					),
			  ],
	};
	return changeset;
}

function dropTriggerMigration(diff: TriggerDropDiff, droppedTables: string[]) {
	const tableName = diff.path[1];
	const triggerName = Object.keys(
		diff.oldValue,
	)[0] as keyof typeof diff.oldValue;
	const triggerValue = diff.oldValue[
		triggerName
	] as (typeof diff.oldValue)[keyof typeof diff.oldValue];
	const trigger = triggerValue.split(":");

	const changeset: Changeset = {
		priority: MigrationOpPriority.TriggerDrop,
		tableName: tableName,
		type: ChangeSetType.DropTrigger,
		up: droppedTables.includes(tableName)
			? [[]]
			: [
					executeKyselyDbStatement(
						`DROP TRIGGER ${triggerName} ON ${tableName}`,
					),
			  ],
		down: [
			executeKyselyDbStatement(
				`${trigger[1]?.replace(
					"CREATE TRIGGER",
					"CREATE OR REPLACE TRIGGER",
				)};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${
					trigger[0]
				}';`,
			),
		],
	};
	return changeset;
}

function changeTriggerMigration(diff: TriggerChangeDiff) {
	const tableName = diff.path[1];
	const triggerName = diff.path[2];
	const newValue = diff.value;
	const newTrigger = newValue.split(":");
	const oldValue = diff.oldValue;
	const oldTrigger = oldValue.split(":");

	const changeset: Changeset = {
		priority: MigrationOpPriority.TriggerUpdate,
		tableName: tableName,
		type: ChangeSetType.UpdateTrigger,
		up: [
			executeKyselyDbStatement(
				`${newTrigger[1]};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${newTrigger[0]}';`,
			),
		],
		down: [
			executeKyselyDbStatement(
				`${oldTrigger[1]?.replace(
					"CREATE TRIGGER",
					"CREATE OR REPLACE TRIGGER",
				)};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${
					oldTrigger[0]
				}';`,
			),
		],
	};
	return changeset;
}
