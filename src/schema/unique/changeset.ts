import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { executeKyselySchemaStatement } from "../../changeset/helpers.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../introspection/schemas.js";

export function uniqueConstraintMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
) {
	if (isUniqueConstraintCreateFirst(diff)) {
		return createUniqueFirstConstraintMigration(diff, addedTables);
	}
	if (isUniqueConstraintDropLast(diff)) {
		return dropUniqueLastConstraintMigration(diff, droppedTables);
	}
	if (isUniqueConstraintChange(diff)) {
		return changeUniqueConstraintMigration(diff);
	}
	if (isUniqueContraintCreateDiff(diff)) {
		return createUniqueConstraintMigration(diff);
	}
	if (isUniqueConstraintDropDiff(diff)) {
		return dropUniqueConstraintMigration(diff);
	}
}

type UniqueCreateFirst = {
	type: "CREATE";
	path: ["uniqueConstraints", string];
	value: {
		[key: string]: string;
	};
};

type UniqueCreateDiff = {
	type: "CREATE";
	path: ["uniqueConstraints", string, string];
	value: string;
};

type UniqueDropLast = {
	type: "REMOVE";
	path: ["uniqueConstraints", string];
	oldValue: {
		[key: string]: string;
	};
};

type UuniqueDropDiff = {
	type: "REMOVE";
	path: ["uniqueConstraints", string, string];
	oldValue: string;
};

type UniqueChangeDiff = {
	type: "CHANGE";
	path: ["uniqueConstraints", string, string];
	value: string;
	oldValue: string;
};

function isUniqueConstraintCreateFirst(
	test: Difference,
): test is UniqueCreateFirst {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object"
	);
}

function isUniqueContraintCreateDiff(
	test: Difference,
): test is UniqueCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string"
	);
}

function isUniqueConstraintDropLast(test: Difference): test is UniqueDropLast {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object"
	);
}

function isUniqueConstraintDropDiff(test: Difference): test is UuniqueDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.oldValue === "string"
	);
}

function isUniqueConstraintChange(test: Difference): test is UniqueChangeDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function createUniqueFirstConstraintMigration(
	diff: UniqueCreateFirst,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	return Object.entries(diff.value).reduce((acc, [, value]) => {
		const uniqueConstraint = uniqueConstraintDefinition(value);
		const changeset: Changeset = {
			priority: MigrationOpPriority.ConstraintCreate,
			tableName: tableName,
			type: ChangeSetType.CreateConstraint,
			up: [addUniqueConstraintOp(tableName, uniqueConstraint)],
			down: addedTables.includes(tableName)
				? [[]]
				: [dropUniqueConstraintOp(tableName, uniqueConstraint)],
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function dropUniqueLastConstraintMigration(
	diff: UniqueDropLast,
	droppedTables: string[],
) {
	const tableName = diff.path[1];

	return Object.entries(diff.oldValue).reduce((acc, [, value]) => {
		const constraintValue = value;
		const uniqueConstraint = uniqueConstraintDefinition(constraintValue);
		const changeset: Changeset = {
			priority: MigrationOpPriority.ConstraintDrop,
			tableName: tableName,
			type: ChangeSetType.DropConstraint,
			up: droppedTables.includes(tableName)
				? [[]]
				: [dropUniqueConstraintOp(tableName, uniqueConstraint)],
			down: [addUniqueConstraintOp(tableName, uniqueConstraint)],
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function changeUniqueConstraintMigration(diff: UniqueChangeDiff) {
	const tableName = diff.path[1];
	const newUniqueConstraint = uniqueConstraintDefinition(diff.value);
	const oldUniqueConstraint = uniqueConstraintDefinition(diff.oldValue);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintChange,
		tableName: tableName,
		type: ChangeSetType.ChangeConstraint,
		up: [
			dropUniqueConstraintOp(tableName, oldUniqueConstraint),
			addUniqueConstraintOp(tableName, newUniqueConstraint),
		],
		down: [
			dropUniqueConstraintOp(tableName, newUniqueConstraint),
			addUniqueConstraintOp(tableName, oldUniqueConstraint),
		],
	};
	return changeset;
}

function createUniqueConstraintMigration(diff: UniqueCreateDiff) {
	const tableName = diff.path[1];
	const uniqueConstraint = uniqueConstraintDefinition(diff.value);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: [addUniqueConstraintOp(tableName, uniqueConstraint)],
		down: [dropUniqueConstraintOp(tableName, uniqueConstraint)],
	};
	return changeset;
}

function dropUniqueConstraintMigration(diff: UuniqueDropDiff) {
	const tableName = diff.path[1];
	const uniqueConstraint = uniqueConstraintDefinition(diff.oldValue);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: [dropUniqueConstraintOp(tableName, uniqueConstraint)],
		down: [addUniqueConstraintOp(tableName, uniqueConstraint)],
	};
	return changeset;
}

type ConstraintDefinition = {
	name: string;
	distinct: boolean;
	columns: string[];
};

function uniqueConstraintDefinition(unique: string) {
	const [, columns] = unique.split("DISTINCT (");

	const definition: ConstraintDefinition = {
		name: unique.match(/"(\w+)"/)?.[1] || "",
		distinct: unique.includes("UNIQUE NULLS DISTINCT"),
		columns: columns?.replace(/"/g, "").split(")")[0]?.split(", ") || [],
	};
	return definition;
}

function addUniqueConstraintOp(
	tableName: string,
	definition: ConstraintDefinition,
): string[] {
	return executeKyselySchemaStatement(
		`alterTable("${tableName}")`,
		`addUniqueConstraint("${definition.name}", [${definition.columns
			.map((col) => `"${col}"`)
			.join(", ")}]${
			!definition.distinct ? ", (col) => col.nullsNotDistinct()" : ""
		})`,
	);
}

function dropUniqueConstraintOp(
	tableName: string,
	definition: ConstraintDefinition,
): string[] {
	return executeKyselySchemaStatement(
		`alterTable("${tableName}")`,
		`dropConstraint("${definition.name}")`,
	);
}
