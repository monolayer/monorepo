/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../../../../changeset/helpers.js";

export function foreignKeyMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isForeignKeyConstraintCreateFirst(diff)) {
		return createforeignKeyFirstConstraintMigration(diff, context);
	}
	if (isForeignKeyConstraintDropLast(diff)) {
		return dropforeignKeyLastConstraintMigration(diff, context);
	}
	if (isForeignKeyConstraintCreate(diff)) {
		return createForeignKeyConstraintMigration(diff, context);
	}
	if (isForeignKeyConstraintDrop(diff)) {
		return dropForeignKeyConstraintMigration(diff, context);
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

function createforeignKeyFirstConstraintMigration(
	diff: ForeignKeyCreateFirstDiff,
	{ schemaName, addedTables }: GeneratorContext,
) {
	const tableName = diff.path[1];
	return Object.entries(diff.value).reduce((acc, [, value]) => {
		const constraintValue = value;
		const changeset: Changeset = {
			priority: MigrationOpPriority.ConstraintCreate,
			tableName: tableName,
			type: ChangeSetType.CreateConstraint,
			up: addForeigKeyOps(
				tableName,
				foreignKeyDefinition(constraintValue),
				schemaName,
			),
			down: addedTables.includes(tableName)
				? [[]]
				: [
						dropForeignKeyOp(
							tableName,
							foreignKeyDefinition(constraintValue),
							schemaName,
						),
					],
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function createForeignKeyConstraintMigration(
	diff: ForeignKeyCreateDiff,
	{ schemaName }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const constraintValue = diff.value;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: addForeigKeyOps(
			tableName,
			foreignKeyDefinition(constraintValue),
			schemaName,
		),
		down: [
			dropForeignKeyOp(
				tableName,
				foreignKeyDefinition(constraintValue),
				schemaName,
			),
		],
	};
	return changeset;
}

function dropforeignKeyLastConstraintMigration(
	diff: ForeignKeyDropLastDiff,
	{ schemaName, droppedTables }: GeneratorContext,
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
				: [
						dropForeignKeyOp(
							tableName,
							foreignKeyDefinition(constraintValue),
							schemaName,
						),
					],
			down: addForeigKeyOps(
				tableName,
				foreignKeyDefinition(constraintValue),
				schemaName,
			),
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function dropForeignKeyConstraintMigration(
	diff: ForeignKeyDropDiff,
	{ schemaName }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const constraintValue = diff.oldValue;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: [
			dropForeignKeyOp(
				tableName,
				foreignKeyDefinition(constraintValue),
				schemaName,
			),
		],
		down: addForeigKeyOps(
			tableName,
			foreignKeyDefinition(constraintValue),
			schemaName,
		),
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

function addForeigKeyOps(
	tableName: string,
	definition: ForeignKeyDefinition,
	schemaName: string,
) {
	const columns = definition.columns.map((col) => `"${col}"`).join(", ");
	const targetColumns = definition.targetColumns
		.map((col) => `"${col}"`)
		.join(", ");

	const ops = [
		[
			[
				`await sql\`\${sql.raw(`,
				`  db`,
				`    .withSchema("${schemaName}")`,
				`    .schema.alterTable("${tableName}")`,
				`    .addForeignKeyConstraint("${definition.name}", [${columns}], "${definition.targetTable}", [${targetColumns}])`,
				`    .onDelete("${definition.onDelete}")`,
				`    .onUpdate("${definition.onUpdate}")`,
				`    .compile()`,
				`    .sql.concat(" not valid")`,
				`)}\`.execute(db);`,
			].join("\n"),
		],
		executeKyselyDbStatement(
			`ALTER TABLE "${schemaName}"."${tableName}" VALIDATE CONSTRAINT "${definition.name}"`,
		),
	];
	return ops;
}

function dropForeignKeyOp(
	tableName: string,
	definition: ForeignKeyDefinition,
	schemaName: string,
): string[] {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`dropConstraint("${definition.name}")`,
	);
}
