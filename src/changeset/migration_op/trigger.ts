import type { Difference } from "microdiff";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../introspection/schemas.js";
import { ChangeSetType, type Changeset } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export function triggerMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
) {
	if (isTriggerCreateFirst(diff)) {
		return createTriggerFirstMigration(diff, addedTables);
	}
	if (isTriggerCreate(diff)) {
		return createTriggerMigration(diff);
	}
	if (isTriggerDropFirst(diff)) {
		return dropTriggerFirstMigration(diff, droppedTables);
	}
	if (isTriggerDrop(diff)) {
		return dropTriggerMigration(diff);
	}
	if (isTriggerChange(diff)) {
		return changeTriggerMigration(diff);
	}
}

type TriggerCreateFirstDiff = {
	type: "CREATE";
	path: ["triggers", string];
	value: {
		[key: string]: string;
	};
};

type TriggerCreateDiff = {
	type: "CREATE";
	path: ["triggers", string, string];
	value: string;
};

type TriggerDropFirstDiff = {
	type: "REMOVE";
	path: ["triggers", string];
	oldValue: {
		[key: string]: string;
	};
};

type TriggerDropDiff = {
	type: "REMOVE";
	path: ["triggers", string, string];
	oldValue: string;
};

type TriggerChangeDiff = {
	type: "CHANGE";
	path: ["triggers", string, string];
	value: string;
	oldValue: string;
};

function isTriggerCreateFirst(
	test: Difference,
): test is TriggerCreateFirstDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object"
	);
}

function isTriggerCreate(test: Difference): test is TriggerCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 3 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string"
	);
}

function isTriggerDropFirst(test: Difference): test is TriggerDropFirstDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object"
	);
}

function isTriggerDrop(test: Difference): test is TriggerDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 3 &&
		test.path[0] === "triggers" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.oldValue === "string"
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

function createTriggerFirstMigration(
	diff: TriggerCreateFirstDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	return Object.entries(diff.value).reduce((acc, [key, value]) => {
		const trigger = value.split(":");
		const changeset: Changeset = {
			priority: MigrationOpPriority.TriggerCreate,
			tableName: tableName,
			type: ChangeSetType.CreateTrigger,
			up: [
				executeKyselyDbStatement(
					`${trigger[1]};COMMENT ON TRIGGER ${key} ON ${tableName} IS '${trigger[0]}';`,
				),
			],
			down: addedTables.includes(tableName)
				? [[]]
				: [executeKyselyDbStatement(`DROP TRIGGER ${key} ON ${tableName}`)],
		};
		return acc.concat(changeset);
	}, [] as Changeset[]);
}

function createTriggerMigration(diff: TriggerCreateDiff) {
	const tableName = diff.path[1];
	const triggerName = diff.path[2];
	const trigger = diff.value.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.TriggerCreate,
		tableName: tableName,
		type: ChangeSetType.CreateTrigger,
		up: [
			executeKyselyDbStatement(
				`${trigger[1]};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${trigger[0]}';`,
			),
		],
		down: [
			executeKyselyDbStatement(`DROP TRIGGER ${triggerName} ON ${tableName}`),
		],
	};
	return changeset;
}

function dropTriggerFirstMigration(
	diff: TriggerDropFirstDiff,
	droppedTables: string[],
) {
	const tableName = diff.path[1];
	return Object.entries(diff.oldValue).reduce((acc, [key, value]) => {
		const trigger = value.split(":");
		const changeset: Changeset = {
			priority: MigrationOpPriority.TriggerDrop,
			tableName: tableName,
			type: ChangeSetType.DropTrigger,
			up: droppedTables.includes(tableName)
				? [[]]
				: [executeKyselyDbStatement(`DROP TRIGGER ${key} ON ${tableName}`)],
			down: [
				executeKyselyDbStatement(
					`${trigger[1]?.replace(
						"CREATE TRIGGER",
						"CREATE OR REPLACE TRIGGER",
					)};COMMENT ON TRIGGER ${key} ON ${tableName} IS '${trigger[0]}';`,
				),
			],
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function dropTriggerMigration(diff: TriggerDropDiff) {
	const tableName = diff.path[1];
	const triggerName = diff.path[2];
	const trigger = diff.oldValue.split(":");
	const changeset: Changeset = {
		priority: MigrationOpPriority.TriggerDrop,
		tableName: tableName,
		type: ChangeSetType.DropTrigger,
		up: [
			executeKyselyDbStatement(`DROP TRIGGER ${triggerName} ON ${tableName}`),
		],
		down: [
			executeKyselyDbStatement(
				`${trigger[1]?.replace(
					"CREATE TRIGGER",
					"CREATE OR REPLACE TRIGGER",
				)};COMMENT ON TRIGGER ${triggerName} ON ${tableName} IS '${trigger[0]}';`,
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
