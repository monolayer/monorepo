/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
	includedInRecord,
} from "~pg/changeset/helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import {
	type ForeignKeyDefinition,
	ForeignKeyBuilder,
} from "~pg/introspection/introspection/foreign-key-builder.js";
import {
	currentTableName,
	previousTableName,
} from "~pg/introspection/introspection/table-name.js";
import type { TablesToRename } from "~pg/introspection/schema.js";
import type { SchemaMigrationInfo } from "~pg/schema/column/types.js";

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
	if (isForeignKeyNameChange(diff)) {
		return changeForeignKeyChangeMigration(diff, context);
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

type ForeignKeyNameChangeDiff = {
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

function isForeignKeyNameChange(
	test: Difference,
): test is ForeignKeyNameChangeDiff {
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
	{
		local,
		schemaName,
		addedTables,
		tablesToRename,
		columnsToRename,
		camelCase: camelCaseOptions,
		addedColumns,
	}: GeneratorContext,
) {
	const tableName = currentTableName(diff.path[1], tablesToRename, schemaName);
	return Object.entries(diff.value).reduce((acc, [hashValue]) => {
		const definition = foreignKeyDefinition(
			tableName,
			hashValue,
			local,
			"current",
			{
				columnsToRename,
				tablesToRename,
				camelCase: camelCaseOptions,
				schemaName,
			},
		);

		const allAddedColumns = includedInRecord(
			definition.columns,
			addedColumns,
			tableName,
		);

		const changeset: Changeset = {
			priority: MigrationOpPriority.ForeignKeyCreate,
			phase:
				addedTables.includes(tableName) || allAddedColumns
					? ChangesetPhase.Expand
					: ChangesetPhase.Alter,
			schemaName,
			tableName: tableName,
			currentTableName: currentTableName(tableName, tablesToRename, schemaName),
			type: ChangesetType.CreateForeignKey,
			up: addForeigKeyOps(tableName, definition, schemaName),
			down: addedTables.includes(tableName)
				? [[]]
				: [dropForeignKeyOp(tableName, definition, schemaName)],
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function createForeignKeyConstraintMigration(
	diff: ForeignKeyCreateDiff,
	{
		local,
		schemaName,
		tablesToRename,
		columnsToRename,
		camelCase: camelCaseOptions,
		addedTables,
		addedColumns,
	}: GeneratorContext,
) {
	const tableName = currentTableName(diff.path[1], tablesToRename, schemaName);
	const definition = foreignKeyDefinition(
		tableName,
		diff.path[2],
		local,
		"current",
		{
			columnsToRename,
			tablesToRename,
			camelCase: camelCaseOptions,
			schemaName,
		},
	);

	const allAddedColumns = includedInRecord(
		definition.columns,
		addedColumns,
		tableName,
	);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ForeignKeyCreate,
		phase:
			addedTables.includes(tableName) || allAddedColumns
				? ChangesetPhase.Expand
				: ChangesetPhase.Alter,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.CreateForeignKey,
		up: addForeigKeyOps(tableName, definition, schemaName),
		down: [
			dropForeignKeyOp(
				currentTableName(tableName, tablesToRename, schemaName),
				definition,
				schemaName,
			),
		],
	};
	return changeset;
}

function dropforeignKeyLastConstraintMigration(
	diff: ForeignKeyDropLastDiff,
	{
		schemaName,
		droppedTables,
		tablesToRename,
		columnsToRename,
		db,
		camelCase: camelCaseOptions,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	return Object.entries(diff.oldValue).reduce((acc, [hashValue]) => {
		const definition = foreignKeyDefinition(
			tableName,
			hashValue,
			db,
			"previous",
			{
				columnsToRename,
				tablesToRename,
				camelCase: camelCaseOptions,
				schemaName,
			},
		);

		const changeset: Changeset = {
			priority: MigrationOpPriority.ForeignKeyDrop,
			phase: droppedTables.includes(tableName)
				? ChangesetPhase.Contract
				: ChangesetPhase.Alter,
			schemaName,
			tableName: tableName,
			currentTableName: currentTableName(tableName, tablesToRename, schemaName),
			type: ChangesetType.DropForeignKey,
			up: droppedTables.includes(tableName)
				? [[]]
				: [dropForeignKeyOp(tableName, definition, schemaName)],
			down: addForeigKeyOps(tableName, definition, schemaName),
		};
		acc.push(changeset);
		return acc;
	}, [] as Changeset[]);
}

function dropForeignKeyConstraintMigration(
	diff: ForeignKeyDropDiff,
	{
		schemaName,
		tablesToRename,
		columnsToRename,
		db,
		camelCase: camelCaseOptions,
		droppedTables,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	const hashValue = diff.path[2];

	const definition = foreignKeyDefinition(
		tableName,
		hashValue,
		db,
		"previous",
		{
			columnsToRename,
			tablesToRename,
			camelCase: camelCaseOptions,
			schemaName,
		},
	);
	const changeset: Changeset = {
		priority: MigrationOpPriority.ForeignKeyDrop,
		phase: droppedTables.includes(tableName)
			? ChangesetPhase.Contract
			: ChangesetPhase.Alter,
		tableName: previousTableName(tableName, tablesToRename),
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		schemaName,
		type: ChangesetType.DropForeignKey,
		up: [
			dropForeignKeyOp(
				previousTableName(tableName, tablesToRename),
				definition,
				schemaName,
			),
		],
		down: addForeigKeyOps(
			previousTableName(tableName, tablesToRename),
			definition,
			schemaName,
		),
	};
	return changeset;
}

function changeForeignKeyChangeMigration(
	diff: ForeignKeyNameChangeDiff,
	{
		schemaName,
		tablesToRename,
		local,
		camelCase: camelCaseOptions,
		columnsToRename,
	}: GeneratorContext,
) {
	const tableName = currentTableName(diff.path[1], tablesToRename, schemaName);
	const previousLocalDef = foreignKeyDefinition(
		tableName,
		diff.path[2],
		local,
		"previous",
		{
			columnsToRename,
			tablesToRename,
			camelCase: camelCaseOptions,
			schemaName,
		},
	);
	const currentLocalDef = foreignKeyDefinition(
		tableName,
		diff.path[2],
		local,
		"current",
		{
			columnsToRename,
			tablesToRename,
			camelCase: camelCaseOptions,
			schemaName,
		},
	);
	if (previousLocalDef.name === currentLocalDef.name) {
		return [];
	}
	return renameForeignKeyOp(
		tableName,
		previousLocalDef.name,
		currentLocalDef.name,
		schemaName,
		tablesToRename,
	);
}

function renameForeignKeyOp(
	tableName: string,
	oldName: string,
	newName: string,
	schemaName: string,
	tablesToRename: TablesToRename,
) {
	return {
		priority: MigrationOpPriority.ConstraintChange,
		phase: ChangesetPhase.Alter,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.RenameForeignKey,
		up: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${oldName} TO ${newName}`,
			),
		],
		down: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${newName} TO ${oldName}`,
			),
		],
	} satisfies Changeset;
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

function foreignKeyDefinition(
	tableName: string,
	hash: string,
	schema: SchemaMigrationInfo,
	mode: "current" | "previous",
	{
		columnsToRename,
		tablesToRename,
		camelCase,
		schemaName,
	}: Pick<
		GeneratorContext,
		"tablesToRename" | "columnsToRename" | "camelCase" | "schemaName"
	>,
) {
	const localDef = fetchForeignKeyDefinition(tableName, hash, schema);
	const localBuilder = new ForeignKeyBuilder(tableName, localDef, {
		tablesToRename,
		columnsToRename,
		camelCase,
		schemaName: schemaName,
		external: false,
	});
	return localBuilder.definition(mode);
}

function fetchForeignKeyDefinition(
	tableName: string,
	hash: string,
	local: SchemaMigrationInfo,
) {
	const fks = local.foreignKeyDefinitions || {};
	const tableForeignKeyDefinition = fks[tableName] || {};
	return tableForeignKeyDefinition[hash]!;
}
