import type { Difference } from "microdiff";
import { ChangeSetType } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

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

export function isTriggerCreate(test: Difference): test is TriggerCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

export function isTriggerDrop(test: Difference): test is TriggerDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object" &&
		Object.keys(test.oldValue).length === 1
	);
}

export function isTriggerChange(test: Difference): test is TriggerChangeDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

export function createTriggerMigration(
	diff: TriggerCreateDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	const triggerName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const triggerValue = diff.value[
		triggerName
	] as (typeof diff.value)[keyof typeof diff.value];
	const trigger = triggerValue.split(":");

	return {
		priority: MigrationOpPriority.TriggerCreate,
		tableName: tableName,
		type: ChangeSetType.CreateTrigger,
		up: executeKyselyDbStatement(
			`${trigger[1]};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${trigger[0]}';`,
		),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(`DROP TRIGGER ${triggerName} ON ${tableName}`),
	};
}

export function dropTriggerMigration(
	diff: TriggerDropDiff,
	droppedTables: string[],
) {
	const tableName = diff.path[1];
	const triggerName = Object.keys(
		diff.oldValue,
	)[0] as keyof typeof diff.oldValue;
	const triggerValue = diff.oldValue[
		triggerName
	] as (typeof diff.oldValue)[keyof typeof diff.oldValue];
	const trigger = triggerValue.split(":");

	return {
		priority: MigrationOpPriority.TriggerDrop,
		tableName: tableName,
		type: ChangeSetType.DropTrigger,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(`DROP TRIGGER ${triggerName} ON ${tableName}`),
		down: executeKyselyDbStatement(
			`${trigger[1]};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${trigger[0]}';`,
		),
	};
}

export function changeTriggerMigration(diff: TriggerChangeDiff) {
	const tableName = diff.path[1];
	const triggerName = diff.path[2];
	const newValue = diff.value;
	const newTrigger = newValue.split(":");
	const oldValue = diff.oldValue;
	const oldTrigger = oldValue.split(":");

	return {
		priority: MigrationOpPriority.TriggerUpdate,
		tableName: tableName,
		type: ChangeSetType.UpdateTrigger,
		up: executeKyselyDbStatement(
			`DROP TRIGGER ${triggerName} ON ${tableName};${newTrigger[1]};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${newTrigger[0]}';`,
		),
		down: executeKyselyDbStatement(
			`DROP TRIGGER ${triggerName} ON ${tableName};${oldTrigger[1]};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${oldTrigger[0]}';`,
		),
	};
}
