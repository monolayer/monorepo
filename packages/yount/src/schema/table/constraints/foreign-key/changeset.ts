import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/introspection/introspection.js";
import { executeKyselySchemaStatement } from "../../../../changeset/helpers.js";

export function foreignKeyMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_schemaName: string,
) {
	if (isForeignKeyConstraintCreateFirst(diff)) {
		return createforeignKeyFirstConstraintMigration(diff, addedTables);
	}
	if (isForeignKeyConstraintDropLast(diff)) {
		return dropforeignKeyLastConstraintMigration(diff, droppedTables);
	}
	if (isForeignKeyConstraintChange(diff)) {
		return changeforeignKeyConstraintMigration(diff);
	}
	if (isForeignKeyConstraintCreate(diff)) {
		return createForeignKeyConstraintMigration(diff);
	}
	if (isForeignKeyConstraintDrop(diff)) {
		return dropForeignKeyConstraintMigration(diff);
	}
}

type ForeignKeyCreateFirstDiff = {
	type: "CREATE";
	path: ["foreignKeyConstraints", string];
	value: {
		[key: string]: string;
	};
};

type ForeignKeyCreateDiff = {
	type: "CREATE";
	path: ["foreignKeyConstraints", string, string];
	value: string;
};

type ForeignKeyDropLastDiff = {
	type: "REMOVE";
	path: ["foreignKeyConstraints", string];
	oldValue: {
		[key: string]: string;
	};
};

type ForeignKeyDropDiff = {
	type: "REMOVE";
	path: ["foreignKeyConstraints", string, string];
	oldValue: string;
};

type ForeignKeyChangeDiff = {
	type: "CHANGE";
	path: ["foreignKeyConstraints", string, string];
	value: string;
	oldValue: string;
};

function isForeignKeyConstraintCreateFirst(
	test: Difference,
): test is ForeignKeyCreateFirstDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object"
	);
}

function isForeignKeyConstraintCreate(
	test: Difference,
): test is ForeignKeyCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 3 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string"
	);
}

function isForeignKeyConstraintDropLast(
	test: Difference,
): test is ForeignKeyDropLastDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object"
	);
}

function isForeignKeyConstraintDrop(
	test: Difference,
): test is ForeignKeyDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 3 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.oldValue === "string"
	);
}

function isForeignKeyConstraintChange(
	test: Difference,
): test is ForeignKeyChangeDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function createforeignKeyFirstConstraintMigration(
	diff: ForeignKeyCreateFirstDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	return Object.entries(diff.value).reduce((acc, [, value]) => {
		const constraintValue = value;
		const changeset: Changeset = {
			priority: MigrationOpPriority.ConstraintCreate,
			tableName: tableName,
			type: ChangeSetType.CreateConstraint,
			up: [addForeigKeyOp(tableName, foreignKeyDefinition(constraintValue))],
			down: addedTables.includes(tableName)
				? [[]]
				: [dropForeignKeyOp(tableName, foreignKeyDefinition(constraintValue))],
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function createForeignKeyConstraintMigration(diff: ForeignKeyCreateDiff) {
	const tableName = diff.path[1];
	const constraintValue = diff.value;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: [addForeigKeyOp(tableName, foreignKeyDefinition(constraintValue))],
		down: [dropForeignKeyOp(tableName, foreignKeyDefinition(constraintValue))],
	};
	return changeset;
}

function dropforeignKeyLastConstraintMigration(
	diff: ForeignKeyDropLastDiff,
	droppedTables: string[],
) {
	const tableName = diff.path[1];
	return Object.entries(diff.oldValue).reduce((acc, [, value]) => {
		const constraintValue = value;
		const changeset: Changeset = {
			priority: MigrationOpPriority.ConstraintDrop,
			tableName: tableName,
			type: ChangeSetType.DropConstraint,
			up: droppedTables.includes(tableName)
				? [[]]
				: [dropForeignKeyOp(tableName, foreignKeyDefinition(constraintValue))],
			down: [addForeigKeyOp(tableName, foreignKeyDefinition(constraintValue))],
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function dropForeignKeyConstraintMigration(diff: ForeignKeyDropDiff) {
	const tableName = diff.path[1];
	const constraintValue = diff.oldValue;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: [dropForeignKeyOp(tableName, foreignKeyDefinition(constraintValue))],
		down: [addForeigKeyOp(tableName, foreignKeyDefinition(constraintValue))],
	};
	return changeset;
}

function changeforeignKeyConstraintMigration(diff: ForeignKeyChangeDiff) {
	const tableName = diff.path[1];
	const newForeignKey = foreignKeyDefinition(diff.value);
	const oldForeignKey = foreignKeyDefinition(diff.oldValue);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintChange,
		tableName: tableName,
		type: ChangeSetType.ChangeConstraint,
		up: [
			dropForeignKeyOp(tableName, oldForeignKey),
			addForeigKeyOp(tableName, newForeignKey),
		],
		down: [
			dropForeignKeyOp(tableName, newForeignKey),
			addForeigKeyOp(tableName, oldForeignKey),
		],
	};
	return changeset;
}

type ForeignKeyDefinition = {
	name: string;
	columns: string[];
	targetTable: string;
	targetColumns: string[];
	onDelete: string;
	onUpdate: string;
};

function foreignKeyDefinition(foreignKey: string) {
	const definition: ForeignKeyDefinition = {
		name: foreignKey.match(/"(\w+)"/)?.[1] || "",
		columns: (foreignKey.match(/FOREIGN KEY \(((\w|,|\s|")+)\)/)?.[1] || "")
			.replace(/ /g, "")
			.replace(/"/g, "")
			.split(","),
		targetTable: foreignKey.match(/REFERENCES (\w+)/)?.[1] || "",
		targetColumns: (
			foreignKey.match(/REFERENCES \w+ \(((\w|,|\s|")+)\)/)?.[1] || ""
		)
			.replace(/ /g, "")
			.replace(/"/g, "")
			.split(","),
		onDelete:
			foreignKey
				.match(
					/ON DELETE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
				)?.[1]
				?.toLowerCase() || "",
		onUpdate:
			foreignKey
				.match(
					/ON UPDATE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
				)?.[1]
				?.toLowerCase() || "",
	};
	return definition;
}

function addForeigKeyOp(
	tableName: string,
	definition: ForeignKeyDefinition,
): string[] {
	const columns = definition.columns.map((col) => `"${col}"`).join(", ");
	const targetColumns = definition.targetColumns
		.map((col) => `"${col}"`)
		.join(", ");
	return executeKyselySchemaStatement(
		`alterTable("${tableName}")`,
		`addForeignKeyConstraint("${definition.name}", [${columns}], "${definition.targetTable}", [${targetColumns}])`,
		`onDelete("${definition.onDelete}")`,
		`onUpdate("${definition.onUpdate}")`,
	);
}

function dropForeignKeyOp(
	tableName: string,
	definition: ForeignKeyDefinition,
): string[] {
	return executeKyselySchemaStatement(
		`alterTable("${tableName}")`,
		`dropConstraint("${definition.name}")`,
	);
}
