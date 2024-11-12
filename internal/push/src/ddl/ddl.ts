/* eslint-disable max-lines */
import { redefineCheck } from "@monorepo/pg/introspection/check.js";
import type { ForeignKeyDefinition } from "@monorepo/pg/introspection/introspection/foreign-key-builder.js";
import { extractColumnsFromPrimaryKey } from "@monorepo/pg/introspection/schema.js";
import {
	alignColumns,
	type ColumnToAlign,
} from "@monorepo/programs/introspect/alignment.js";
import {
	CreateTableBuilder,
	sql,
	type ColumnDefinitionBuilder,
	type OnModifyForeignAction,
} from "kysely";
import {
	foreignKeyDefinition,
	type AnyKysely,
	type ColumnInfoDiff,
} from "~push/changeset/introspection.js";
import type {
	ChangeEnumDiff,
	CreateEnumDiff,
	CreateExtensionDiff,
	CreateSchemaDiff,
	CreateTableDiff,
	DropEnumDiff,
	DropExtensionDiff,
	DropSchemaDiff,
} from "~push/changeset/types/diff.js";
import { CompiledQuery } from "~push/ddl/compiled-query.js";
import { GeneratorTable } from "~push/ddl/table.js";
import type { ChangesetGenerator } from "~push/state/changeset-generator.js";
import { RawQuery } from "./raw-query.js";

interface DropSchemaOptions extends CreateSchemaOptions {
	warnings?: string;
}

interface CreateTableOptions {
	context: ChangesetGenerator;
	diff: CreateTableDiff;
	db: AnyKysely;
	debug: boolean;
}

export async function createTable(options: CreateTableOptions) {
	const tableName = options.diff.path[1];
	const command = new CompiledQuery(
		options.db
			.withSchema(options.context.schemaName)
			.schema.createTable(tableName)
			.$call((builder) => {
				builder = addColumns(options, builder);
				builder = addPrimaryKey(options, builder);
				builder = addUniqueConstraints(tableName, options, builder);
				builder = addCheckConstraints(options, tableName, builder);
				builder = addForeignKeys(options, tableName, builder);
				return builder;
			}),
		`Create table \`${tableName}\``,
	);
	await command.execute(options.debug);

	const table = new GeneratorTable(tableName, options.context);

	for (const constraint of table.redundantUniqueConstraints) {
		await createUniqueConstraint({
			context: options.context,
			db: options.db,
			debug: options.debug,
			tableName,
			constraint,
		});
	}

	for (const [, column] of Object.entries(options.diff.value.columns)) {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			const query = new RawQuery(
				sql.raw(
					commentForDefault(
						options.context.schemaName,
						tableName,
						`${column.columnName}`,
						valueAndHash,
					),
				),
				`Add comment to column \`${tableName}\`.\`${column.columnName}\``,
				options.db,
			);
			await query.execute(options.debug);
		}
	}
}

interface DropTableOptions {
	context: ChangesetGenerator;
	tableName: string;
	db: AnyKysely;
	debug: boolean;
	warnings?: string;
}

function addForeignKeys(
	options: CreateTableOptions,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createTable: CreateTableBuilder<string, any>,
) {
	Object.entries(options.diff.value.foreignKeys ?? {}).forEach(
		([hashValue]) => {
			const definition = foreignKeyDefinition(
				tableName,
				hashValue,
				options.context.local,
				"current",
				{
					columnsToRename: options.context.columnsToRename,
					tablesToRename: options.context.tablesToRename,
					camelCase: options.context.camelCase,
					schemaName: options.context.schemaName,
				},
			);
			createTable = createTable.addForeignKeyConstraint(
				definition.name,
				definition.columns,
				definition.targetTable,
				definition.targetColumns,
				(cb) => {
					cb = cb.onDelete(definition.onDelete as OnModifyForeignAction);
					cb = cb.onUpdate(definition.onUpdate as OnModifyForeignAction);
					return cb;
				},
			);
		},
	);
	return createTable;
}

function addCheckConstraints(
	options: CreateTableOptions,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createTable: CreateTableBuilder<string, any>,
) {
	Object.entries(options.diff.value.checkConstraints ?? {}).forEach(
		([, value]) => {
			const checkDefinition = redefineCheck(
				value!,
				"current",
				tableName,
				options.context.columnsToRename,
				options.context.schemaName,
			);
			createTable = createTable.addCheckConstraint(
				checkDefinition.name,
				sql.raw(checkDefinition.definition),
			);
		},
	);
	return createTable;
}

function addUniqueConstraints(
	tableName: string,
	options: CreateTableOptions,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createTable: CreateTableBuilder<string, any>,
) {
	const table = new GeneratorTable(tableName, options.context);
	const uniqueConstraints = table.uniqueConstraints;
	uniqueConstraints.forEach((uniqueConstraint) => {
		if (table.isRedundantUniqueConstraint(uniqueConstraint)) {
			return;
		}
		createTable = createTable.addUniqueConstraint(
			uniqueConstraint.name,
			uniqueConstraint.columns,
			(col) => {
				return !uniqueConstraint.distinct ? col.nullsNotDistinct() : col;
			},
		);
	});

	return createTable;
}

function addPrimaryKey(
	options: CreateTableOptions,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createTable: CreateTableBuilder<string, any>,
) {
	Object.entries(options.diff.value.primaryKey ?? {}).forEach(
		([primaryKeyName, primaryKeyValue]) => {
			createTable = createTable.addPrimaryKeyConstraint(
				primaryKeyName,
				extractColumnsFromPrimaryKey(primaryKeyValue),
			);
		},
	);
	return createTable;
}

function addColumns(
	options: CreateTableOptions,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createTable: CreateTableBuilder<string, any>,
) {
	alignColumns(
		Object.entries(options.diff.value.columns).map(([, column]) => column),
		options.context.typeAlignments,
	).forEach((column) => {
		if (column.columnName !== null) {
			createTable = createTable.addColumn(
				column.columnName,
				sql.raw(compileDataType(column.dataType)),
				optionsForColumn(column),
			);
		}
	});
	return createTable;
}

export async function dropTable(options: DropTableOptions) {
	const command = new CompiledQuery(
		options.db
			.withSchema(options.context.schemaName)
			.schema.dropTable(options.tableName),
		`Drop table \`${options.tableName}\``,
		options.warnings,
	);
	await command.execute(options.debug);
}

interface RenameTableOptions {
	schemaName: string;
	table: {
		from: string;
		to: string;
	};
	debug: boolean;
}

export function renameTable({ schemaName, table, debug }: RenameTableOptions) {
	return async (db: AnyKysely) => {
		await new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(table.from)
				.renameTo(table.to),
			`Rename table \`${table.from}\` ~> \`${table.to}\``,
		).execute(debug);
	};
}

export function renameTableObjects({
	schemaName,
	table,
	debug,
}: RenameTableOptions) {
	return async (db: AnyKysely) => {
		await new RawQuery(
			sql.raw(
				tableObjectsRename({
					schemaName: schemaName,
					table,
				}),
			),
			`Rename objects in table \`${schemaName}\`.\`${table.to}\``,
			db,
		).execute(debug);
	};
}

interface RenameColumnOptions {
	schemaName: string;
	tableName: string;
	column: {
		from: string;
		to: string;
	};
	debug: boolean;
}

export function renameColumn({
	schemaName,
	tableName,
	column,
	debug,
}: RenameColumnOptions) {
	return async (db: AnyKysely) => {
		await new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.renameColumn(column.from, column.to),
			`Rename column \`${column.from}\` ~> \`${column.to}\` in \`${schemaName}\`.\`${tableName}\``,
		).execute(debug);
	};
}

interface CreateUniqueConstraintOptions {
	context: ChangesetGenerator;
	tableName: string;
	db: AnyKysely;
	debug: boolean;
	constraint: {
		name: string;
		distinct: boolean;
		columns: string[];
	};
}

export async function createUniqueConstraint(
	options: CreateUniqueConstraintOptions,
) {
	const query = new CompiledQuery(
		options.db
			.withSchema(options.context.schemaName)
			.schema.alterTable(options.tableName)
			.addUniqueConstraint(
				options.constraint.name,
				options.constraint.columns,
				(col) => {
					return !options.constraint.distinct ? col.nullsNotDistinct() : col;
				},
			),
		`Add unique constraint to \`${options.tableName}\``,
	);
	await query.execute(options.debug);
}

interface CreateEnumOptions {
	context: ChangesetGenerator;
	diff: DropEnumDiff | CreateEnumDiff;
}

export function createEnum(options: CreateEnumOptions) {
	return async (db: AnyKysely) => {
		const enumName = options.diff.path[1];
		const enumValues = isCreateDiff(options.diff)
			? options.diff.value.split(", ")
			: options.diff.oldValue.split(", ");
		const query = new CompiledQuery(
			db
				.withSchema(options.context.schemaName)
				.schema.createType(enumName)
				.asEnum(enumValues),
			`Add enum \`${enumName}\``,
		);
		await query.execute(options.context.debug);
		const comment = new RawQuery(
			sql.raw(
				`COMMENT ON TYPE "${options.context.schemaName}"."${enumName}" IS 'monolayer'`,
			),
			`Add comment to enum \`${enumName}\``,
			db,
		);
		await comment.execute(options.context.debug);
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isCreateDiff(diff: any): diff is CreateEnumDiff {
	return diff.value !== undefined;
}

interface DropEnumOptions extends CreateEnumOptions {
	warnings?: string;
}

export function dropEnum(options: DropEnumOptions) {
	return async (db: AnyKysely) => {
		const enumName = options.diff.path[1];
		const query = new CompiledQuery(
			db.withSchema(options.context.schemaName).schema.dropType(enumName),
			`Drop enum \`${enumName}\``,
			options.warnings,
		);
		await query.execute(options.context.debug);
	};
}

interface ChangeEnumOptions {
	context: ChangesetGenerator;
	diff: ChangeEnumDiff;
}

export function changeEnum(options: ChangeEnumOptions) {
	return async (db: AnyKysely) => {
		const enumName = options.diff.path[1];
		const oldEnumValues = options.diff.oldValue.split(", ");
		const newValues = options.diff.value
			.split(", ")
			.filter((value) => value !== "")
			.filter((value) => !oldEnumValues.includes(value));
		for (const newValue of newValues) {
			const query = new RawQuery(
				sql.raw(
					`alter type "${options.context.schemaName}"."${enumName}" add value if not exists '${newValue}'`,
				),
				`Add value "${newValue}" to enum \`${enumName}\``,
				db,
			);
			await query.execute(options.context.debug);
		}
	};
}

interface CreateExtensionOptions {
	logOutput: boolean;
	diff: CreateExtensionDiff | DropExtensionDiff;
}

export function createExtension(options: CreateExtensionOptions) {
	return async (db: AnyKysely) => {
		const extensionName = options.diff.path[1];
		const query = new RawQuery(
			sql.raw(`create extension if not exists ${extensionName};`),
			`Create extension \`${extensionName}\``,
			db,
		);
		await query.execute(options.logOutput);
	};
}

interface DropExtensionOptions extends CreateExtensionOptions {
	warnings?: string;
}

export function dropExtension(options: DropExtensionOptions) {
	const fn = async (db: AnyKysely) => {
		const extensionName = options.diff.path[1];
		const query = new RawQuery(
			sql.raw(`drop extension if exists ${extensionName};`),
			`Drop extension \`${extensionName}\``,
			db,
		);
		await query.execute(options.logOutput);
	};
	return fn;
}

interface CreateSchemaOptions {
	logOutput: boolean;
	diff: CreateSchemaDiff | DropSchemaDiff;
}

interface DropSchemaOptions extends CreateSchemaOptions {
	warnings?: string;
}

export function createSchema(options: CreateSchemaOptions) {
	const fn = async (db: AnyKysely) => {
		const schemaName = options.diff.path[1];
		const query = new RawQuery(
			sql.raw(
				`create schema if not exists "${schemaName}"; comment on schema "${schemaName}" IS 'monolayer';`,
			),
			`Create schema \`${schemaName}\``,
			db,
		);
		await query.execute(options.logOutput);
	};
	return fn;
}

export function dropSchema(options: DropSchemaOptions) {
	const fn = async (db: AnyKysely) => {
		const schemaName = options.diff.path[1];
		const query = new RawQuery(
			sql.raw(`drop schema if exists "${schemaName}" cascade;`),
			`Drop schema \`${schemaName}\``,
			db,
			options.warnings,
		);
		await query.execute(options.logOutput);
	};
	return fn;
}

interface CreateCheckConstraintOptions {
	check: {
		name: string;
		definition: string;
		tableName: string;
		schemaName: string;
	};
	debug: boolean;
	warnings?: string;
}

export function createCheckConstraint({
	check,
	debug,
	warnings,
}: CreateCheckConstraintOptions) {
	return async (db: AnyKysely) => {
		const query = new RawQuery(
			sql.raw(
				db
					.withSchema(check.schemaName)
					.schema.alterTable(check.tableName)
					.addCheckConstraint(check.name, sql.raw(check.definition))
					.compile()
					.sql.concat(" not valid"),
			),
			`Add check constraint \`${check.name}\` to \`${check.tableName}\` (not valid)`,
			db,
		);
		await query.execute(debug);

		const validate = new RawQuery(
			sql.raw(
				`alter table "${check.schemaName}"."${check.tableName}" validate constraint "${check.name}"`,
			),
			`Validate constraint \`${check.name}\``,
			db,
			warnings,
		);
		await validate.execute(debug);
	};
}

interface DropCheckConstraintOptions {
	check: {
		schemaName: string;
		tableName: string;
		name: string;
	};
	debug: boolean;
	warnings?: string;
}

export function dropCheckConstraint({
	check,
	warnings,
	debug,
}: DropCheckConstraintOptions) {
	return async (db: AnyKysely) => {
		console.log(`Drop check constraint \`${check.name}\``, check.tableName);
		const query = new CompiledQuery(
			db
				.withSchema(check.schemaName)
				.schema.alterTable(check.tableName)
				.dropConstraint(check.name),
			`Drop check constraint \`${check.name}\``,
			warnings,
		);
		await query.execute(debug);
	};
}

interface RenameCheckConstraintOptions {
	check: {
		schemaName: string;
		tableName: string;
		name: string;
		previousName: string;
	};
	debug: boolean;
	warnings?: string;
}

export function renameCheckConstraint({
	check,
	warnings,
	debug,
}: RenameCheckConstraintOptions) {
	return async (db: AnyKysely) => {
		const query = new RawQuery(
			sql.raw(
				`alter table "${check.schemaName}"."${check.tableName}" RENAME CONSTRAINT "${check.previousName}" TO "${check.name}"`,
			),
			`Rename check constraint \`${check.previousName}\` ~> \`${check.name}\``,
			db,
			warnings,
		);
		await query.execute(debug);
	};
}

interface ChangeColumnDataTypeOptions {
	column: {
		schemaName: string;
		tableName: string;
		name: string;
		dataType: string;
		oldDataType: string;
	};
	warnings: string;
	debug: boolean;
}

export function changeColumnDataType({
	column,
	warnings,
	debug,
}: ChangeColumnDataTypeOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(column.schemaName)
				.schema.alterTable(column.tableName)
				.alterColumn(column.name, (col) =>
					col.setDataType(sql.raw(`${column.dataType}`)),
				),
			`Change column \`${column.name}\` data type \`${column.oldDataType}\` ~> \`${column.dataType}\``,
			warnings,
		);
		await query.execute(debug);
	};
}

interface SetColumnDefaultOptions {
	column: {
		schemaName: string;
		tableName: string;
		name: string;
		default: string;
	};
	debug: boolean;
	warnings: string;
}

export function setColumnDefault({
	column,
	warnings,
	debug,
}: SetColumnDefaultOptions) {
	return async (db: AnyKysely) => {
		const defaultValue = toValueAndHash(String(column.default));
		const query = new CompiledQuery(
			db
				.withSchema(column.schemaName)
				.schema.alterTable(column.tableName)
				.alterColumn(column.name, (col) =>
					col.setDefault(sql.raw(`${defaultValue.value ?? ""}`)),
				),
			`Set column \`${column.name}\` default`,
			warnings,
		);
		await query.execute(debug);

		const comment = new RawQuery(
			sql.raw(
				`${commentForDefault(
					column.schemaName,
					column.tableName,
					column.name,
					defaultValue,
				)}`,
			),
			`Add comment to column \`${column.name}\``,
			db,
		);
		await comment.execute(debug);
	};
}

interface DropDefaultOptions {
	column: {
		schemaName: string;
		tableName: string;
		name: string;
	};
	warnings: string;
	debug: boolean;
}

export function dropColumnDefault({
	column,
	warnings,
	debug,
}: DropDefaultOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(column.schemaName)
				.schema.alterTable(column.tableName)
				.alterColumn(column.name, (col) => col.dropDefault()),
			`Drop column \`${column.name}\` default`,
			warnings,
		);
		await query.execute(debug);
	};
}

interface AddColumnIdentity {
	column: {
		schemaName: string;
		tableName: string;
		name: string;
		identity: "ALWAYS" | "BY DEFAULT";
	};
	debug: boolean;
}

export function addColumnIdentity({ column, debug }: AddColumnIdentity) {
	return async (db: AnyKysely) => {
		const query = new RawQuery(
			sql.raw(
				column.identity === "ALWAYS"
					? `ALTER TABLE "${column.schemaName}"."${column.tableName}" ALTER COLUMN "${column.name}" ADD GENERATED ALWAYS AS IDENTITY`
					: `ALTER TABLE "${column.schemaName}"."${column.tableName}" ALTER COLUMN "${column.name}" ADD GENERATED BY DEFAULT AS IDENTITY`,
			),
			`Add identity to column \`${column.name}\``,
			db,
		);
		await query.execute(debug);
	};
}

interface DropColumnIdentity {
	column: {
		schemaName: string;
		tableName: string;
		name: string;
	};
	debug: boolean;
}

export function dropColumnIdentity({ column, debug }: DropColumnIdentity) {
	return async (db: AnyKysely) => {
		const query = new RawQuery(
			sql.raw(
				`ALTER TABLE "${column.schemaName}"."${column.tableName}" ALTER COLUMN "${column.name}" DROP IDENTITY`,
			),
			`Drop identity from column \`${column.name}\``,
			db,
		);
		await query.execute(debug);
	};
}

interface DropNotNullOptions {
	schemaName: string;
	tableName: string;
	columnName: string;
	debug: boolean;
}

export function dropNotNull(opts: DropNotNullOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(opts.schemaName)
				.schema.alterTable(opts.tableName)
				.alterColumn(opts.columnName, (col) => col.dropNotNull()),
			`Drop column \`${opts.columnName}\` not null`,
		);
		await query.execute(opts.debug);
	};
}

interface SetNotNullOptions {
	schemaName: string;
	tableName: string;
	columnName: string;
	debug: boolean;
}

export function setNotNull({
	schemaName,
	tableName,
	columnName,
	debug,
}: SetNotNullOptions) {
	return async (db: AnyKysely) => {
		await createCheckConstraint({
			check: {
				schemaName,
				tableName,
				name: `temporary_not_null_check_constraint_${schemaName}_${tableName}_${columnName}`,
				definition: `"${columnName}" IS NOT NULL`,
			},
			debug,
		})(db);
		const query = new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.alterColumn(columnName, (col) => col.setNotNull()),
			`Set column \`${columnName}\` not null`,
		);
		await query.execute(debug);
		await dropCheckConstraint({
			check: {
				schemaName,
				tableName,
				name: `temporary_not_null_check_constraint_${schemaName}_${tableName}_${columnName}`,
			},
			debug,
		})(db);
	};
}

interface CreateColumnOptions {
	schemaName: string;
	tableName: string;
	column: {
		name: string;
		dataType: string;
		definition: ColumnInfoDiff;
		skipNullable: boolean;
	};
	debug: boolean;
}

export function createColumn({
	schemaName,
	tableName,
	column,
	debug,
}: CreateColumnOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.addColumn(
					column.name,
					sql.raw(`${compileDataType(column.dataType)}`),
					optionsForColumn(column.definition, column.skipNullable),
				),
			`Add column ${column.name} to table \`${tableName}\``,
		);
		await query.execute(debug);
		if (column.definition.defaultValue !== null) {
			const defaultValueAndHash = toValueAndHash(
				String(column.definition.defaultValue),
			);
			const comment = new RawQuery(
				sql.raw(
					`${commentForDefault(schemaName, tableName, column.name, defaultValueAndHash)}`,
				),
				`Add comment to column \`${tableName}\`.\`${column.name}\``,
				db,
			);
			await comment.execute(debug);
		}
	};
}

export function createNonNullableColumn({
	schemaName,
	tableName,
	column,
	debug,
}: CreateColumnOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.addColumn(
					column.name,
					sql.raw(`${compileDataType(column.dataType)}`),
					optionsForColumn(column.definition, false),
				),
			`Add column ${column.name} to table \`${tableName}\``,
		);
		await query.execute(debug);
		if (column.definition.defaultValue !== null) {
			const defaultValueAndHash = toValueAndHash(
				String(column.definition.defaultValue),
			);
			const comment = new RawQuery(
				sql.raw(
					`${commentForDefault(schemaName, tableName, column.name, defaultValueAndHash)}`,
				),
				`Add comment to column \`${tableName}\`.\`${column.name}\``,
				db,
			);
			await comment.execute(debug);
		}
		if (
			column.definition.dataType !== "serial" &&
			column.definition.dataType !== "bigserial"
		) {
			await setNotNull({
				schemaName,
				tableName,
				columnName: column.name,
				debug,
			})(db);
		}
	};
}

interface DropColumnOptions {
	schemaName: string;
	tableName: string;
	columnName: string;
	debug: boolean;
}

export function dropColumn({
	schemaName,
	tableName,
	columnName,
	debug,
}: DropColumnOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.dropColumn(columnName),
			`Drop column \`${tableName}\`.\`${columnName}\``,
		);
		await query.execute(debug);
	};
}

interface RenameConstraintOptions {
	schemaName: string;
	tableName: string;
	name: {
		new: string;
		old: string;
	};
	debug: boolean;
}

export function renameConstraint({
	schemaName,
	tableName,
	name,
	debug,
}: RenameConstraintOptions) {
	return async (db: AnyKysely) => {
		const query = new RawQuery(
			sql.raw(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT "${name.old}" TO "${name.new}"`,
			),
			`Rename constraint \`${name.old}\` ~> \`${name.new}\``,
			db,
		);
		await query.execute(debug);
	};
}

interface CreateIndexOptions {
	schemaName: string;
	name: string;
	definition: string;
	debug: boolean;
}

export function createIndexConcurrently({
	schemaName,
	name,
	definition,
	debug,
}: CreateIndexOptions) {
	return async (db: AnyKysely) => {
		const indexDefinition = definition.replace(
			`index "${name}"`,
			`index concurrently "${name}"`,
		);
		const query = new RawQuery(
			sql.raw(indexDefinition),
			`Create index \`${name}\``,
			db,
		);
		try {
			await query.execute(debug);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			await new CompiledQuery(
				db.withSchema(schemaName).schema.dropIndex(name).ifExists(),
				`Drop index "${name}"`,
			).execute(false);
			throw e;
		}
	};
}

export function createIndex({ name, definition, debug }: CreateIndexOptions) {
	return async (db: AnyKysely) => {
		const query = new RawQuery(
			sql.raw(definition.replace(/'/g, "\\'")),
			`Create index \`${name}\``,
			db,
		);
		await query.execute(debug);
	};
}

interface DropIndexOptions {
	schemaName: string;
	name: string;
	debug: boolean;
}

export function dropIndex({ schemaName, name, debug }: DropIndexOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db.withSchema(schemaName).schema.dropIndex(name).ifExists(),
			`Drop index \`${name}\``,
		);
		await query.execute(debug);
	};
}

interface CreateUniqueConstraintWithIndexOptions {
	schemaName: string;
	tableName: string;
	definition: {
		name: string;
		distinct: boolean;
		columns: string[];
	};
	debug: boolean;
}

export function createUniqueConstraintWithIndex({
	schemaName,
	tableName,
	definition,
	debug,
}: CreateUniqueConstraintWithIndexOptions) {
	return async (db: AnyKysely) => {
		const indexName = `${definition.name}_monolayer_uc_idx`;
		const uniqueConstraintColumns = definition.columns
			.map((col) => `"${col}"`)
			.join(", ");
		const nullsDistinct = !definition.distinct ? "nulls not distinct" : "";
		const indexDefinition = `create unique index concurrently "${indexName}" on "${schemaName}"."${tableName}" (${uniqueConstraintColumns}) ${nullsDistinct}`;
		await createIndexConcurrently({
			schemaName,
			name: indexName,
			debug,
			definition: indexDefinition,
		})(db);

		const uniqueConstraintDefinition = `alter table "${schemaName}"."${tableName}" add constraint "${definition.name}" unique using index "${indexName}"`;
		const createConstraint = new RawQuery(
			sql.raw(`${uniqueConstraintDefinition}`),
			`Create unique constraint \`${definition.name}\``,
			db,
		);
		await createConstraint.execute(debug);
	};
}

interface DropUniqueConstraintOptions {
	schemaName: string;
	tableName: string;
	name: string;
	debug: boolean;
}

export function dropUniqueConstraint({
	schemaName,
	tableName,
	name,
	debug,
}: DropUniqueConstraintOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.dropConstraint(name)
				.ifExists(),
			`Drop unique constraint \`${name}\``,
		);
		await query.execute(debug);
	};
}

interface CreatePrimaryKeyWithIndex {
	schemaName: string;
	tableName: string;
	name: string;
	indexName: string;
	debug: boolean;
}

export function createPrimaryKeyWithIndex({
	schemaName,
	tableName,
	name,
	indexName,
	debug,
}: CreatePrimaryKeyWithIndex) {
	return async (db: AnyKysely) => {
		const createConstraint = new RawQuery(
			sql.raw(
				`alter table "${schemaName}"."${tableName}" add constraint "${name}" primary key using index "${indexName}"`,
			),
			`Add primary key to \`${tableName}\``,
			db,
		);
		await createConstraint.execute(debug);
	};
}

interface DropPrimaryKeyOptions {
	schemaName: string;
	tableName: string;
	name: string;
	debug: boolean;
}

export function dropPrimaryKey({
	schemaName,
	tableName,
	name,
	debug,
}: DropPrimaryKeyOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.dropConstraint(name),
			`Drop primary key in \`${tableName}\``,
		);
		await query.execute(debug);
	};
}

interface CreatePrimaryKeyOptions {
	schemaName: string;
	tableName: string;
	name: string;
	value: string;
	debug: boolean;
}

export function createPrimaryKey({
	schemaName,
	tableName,
	name,
	value,
	debug,
}: CreatePrimaryKeyOptions) {
	return async (db: AnyKysely) => {
		const query = new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.addPrimaryKeyConstraint(name, extractColumnsFromPrimaryKey(value)),
			`Create primary key in \`${tableName}\``,
		);
		await query.execute(debug);
	};
}

interface RenameIndexOptions {
	name: string;
	oldName: string;
	debug: boolean;
}

export function renameIndex({ name, oldName, debug }: RenameIndexOptions) {
	return async (db: AnyKysely) => {
		await new RawQuery(
			sql.raw(`ALTER INDEX "${oldName}" RENAME TO "${name}"`),
			`Rename index \`${oldName}\` ~> \`${name}\``,
			db,
		).execute(debug);
	};
}

interface CreateForeignKeyOptions {
	schemaName: string;
	tableName: string;
	definition: ForeignKeyDefinition;
	debug: boolean;
}

export function createForeignKey({
	schemaName,
	tableName,
	definition,
	debug,
}: CreateForeignKeyOptions) {
	return async (db: AnyKysely) => {
		const createForeignKeySQL = sql.raw(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.addForeignKeyConstraint(
					definition.name,
					definition.columns,
					definition.targetTable,
					definition.targetColumns,
				)
				.onDelete(definition.onDelete as OnModifyForeignAction)
				.onUpdate(definition.onUpdate as OnModifyForeignAction)
				.compile()
				.sql.concat(" not valid"),
		);
		await new RawQuery(
			createForeignKeySQL,
			`Create foreign key \`${definition.name} in table \`${tableName}\` (not valid)`,
			db,
		).execute(debug);

		await new RawQuery(
			sql.raw(
				`alter table "${schemaName}"."${tableName}" validate constraint "${definition.name}"`,
			),
			`Validate foreign key \`${definition.name} in table \`${tableName}\``,
			db,
		).execute(debug);
	};
}

interface DropForeignKeyOptions {
	schemaName: string;
	tableName: string;
	name: string;
	debug: boolean;
}

export function dropForeignKey({
	schemaName,
	tableName,
	name,
	debug,
}: DropForeignKeyOptions) {
	return async (db: AnyKysely) => {
		await new CompiledQuery(
			db
				.withSchema(schemaName)
				.schema.alterTable(tableName)
				.dropConstraint(name),
			`Drop foreign key \`${name}\` in table \`${tableName}\``,
		).execute(debug);
	};
}

interface RenameForeignKeyOptions {
	schemaName: string;
	tableName: string;
	name: string;
	oldName: string;
	debug: boolean;
}

export function renameForeignKey({
	schemaName,
	tableName,
	name,
	oldName,
	debug,
}: RenameForeignKeyOptions) {
	return async (db: AnyKysely) => {
		await new RawQuery(
			sql.raw(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT "${oldName}" TO "${name}"`,
			),
			`Rename foreign key \`${oldName}\` ~> \`${name}\``,
			db,
		).execute(debug);
	};
}

interface CreateTriggerOptions {
	name: string;
	definition: string;
	debug: boolean;
}

export function createTrigger({
	definition,
	debug,
	name,
}: CreateTriggerOptions) {
	return async (db: AnyKysely) => {
		await new RawQuery(
			sql.raw(`${definition}`),
			`Create trigger \`${name}\``,
			db,
		).execute(debug);
	};
}

interface DropTriggerOptions {
	schemaName: string;
	tableName: string;
	name: string;
	debug: boolean;
}

export function dropTrigger({
	schemaName,
	tableName,
	name,
	debug,
}: DropTriggerOptions) {
	return async (db: AnyKysely) => {
		await new RawQuery(
			sql.raw(`DROP TRIGGER ${name} ON "${schemaName}"."${tableName}"`),
			`Drop trigger \`${name}\``,
			db,
		).execute(debug);
	};
}

// ALTER TRIGGER name ON table_name RENAME TO new_name

interface RenameTriggerOptions {
	schemaName: string;
	tableName: string;
	name: string;
	oldName: string;
	debug: boolean;
}

export function renameTrigger({
	schemaName,
	tableName,
	name,
	oldName,
	debug,
}: RenameTriggerOptions) {
	return async (db: AnyKysely) => {
		await new RawQuery(
			sql.raw(
				`ALTER TRIGGER "${oldName}" ON "${schemaName}"."${tableName}" RENAME TO "${name}"`,
			),
			`Rename trigger \`${oldName}\` ~> \`${name}\``,
			db,
		).execute(debug);
	};
}
const tableObjectsRename = (options: {
	schemaName: string;
	table: {
		from: string;
		to: string;
	};
}) => {
	return `DO $$
DECLARE
    schema text := '${options.schemaName}';
    old_table_name text := '${options.table.from}';
    new_table_name text := '${options.table.to}';
    old_index_name text;
    new_index_name text;
	  old_constraint_name text;
    new_constraint_name text;
BEGIN
    FOR old_index_name IN
        SELECT i.relname
        FROM pg_class i
        JOIN pg_index idx ON i.oid = idx.indexrelid
        JOIN pg_class t ON idx.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        LEFT JOIN pg_constraint c ON i.oid = c.conindid
        WHERE t.relname = new_table_name
          AND n.nspname = schema
          AND i.relkind = 'i'
          AND c.conname IS NULL
    LOOP
        new_index_name := regexp_replace(old_index_name, '^' || old_table_name, new_table_name);
				    IF old_index_name IS DISTINCT FROM new_index_name THEN
                EXECUTE format('ALTER INDEX %I.%I RENAME TO %I;', schema, old_index_name, new_index_name);
				    END IF;
    END LOOP;

    FOR old_constraint_name IN
        SELECT conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE t.relname = new_table_name
          AND n.nspname = schema
          AND c.contype IN ('p', 'u', 'f', 'c')
    LOOP
        new_constraint_name := regexp_replace(old_constraint_name, '^' || old_table_name, new_table_name);
        IF old_constraint_name IS DISTINCT FROM new_constraint_name THEN
            EXECUTE format('ALTER TABLE %I.%I RENAME CONSTRAINT %I TO %I;', schema, new_table_name, old_constraint_name, new_constraint_name);
				END IF;
    END LOOP;
END $$;`;
};

export function commentForDefault(
	schemaName: string,
	tableName: string,
	columnName: string,
	defaultValueAndHash: DefaultValueAndHash,
) {
	return `COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${defaultValueAndHash.hash ?? ""}'`;
}

export function optionsForColumn(
	column: ColumnToAlign | ColumnInfoDiff,
	skipNullable: boolean = true,
) {
	return (col: ColumnDefinitionBuilder) => {
		let builder: ColumnDefinitionBuilder = col;
		if (skipNullable && column.isNullable === false) {
			builder = builder.notNull();
		}
		if (column.identity === "ALWAYS") {
			builder = builder.generatedAlwaysAsIdentity();
		}
		if (column.identity === "BY DEFAULT") {
			builder = builder.generatedByDefaultAsIdentity();
		}
		if (column.defaultValue !== null) {
			const defaultValueAndHash = toValueAndHash(String(column.defaultValue));
			builder = builder.defaultTo(
				sql.raw(`${defaultValueAndHash.value ?? ""}`),
			);
		}
		return builder;
	};
}

export function compileDataType(dataType: string) {
	const base = dataType.endsWith("[]") ? dataType.split("[]").at(0)! : dataType;
	const isArray = dataType.endsWith("[]");

	if (
		dataTypesWithoutSql.includes(base) ||
		dataType.includes("numeric(") ||
		(dataType.includes("time(") && !dataType.includes("with time zone")) ||
		(dataType.includes("timestamp(") && !dataType.includes("with time zone"))
	) {
		if (isArray) {
			return `${base}[]`;
		}
		return `${dataType}`;
	}
	if (
		dataTypesWithSql.includes(base) ||
		dataType.includes("bit(") ||
		dataType.includes("bit varying(") ||
		dataType.includes("character(") ||
		dataType.includes("character varying(") ||
		dataType.includes("with time zone")
	) {
		if (isArray) {
			return `${base}[]`;
		}
		return `${dataType}`;
	}
	if (isArray) {
		return `"${base}"[]`;
	} else {
		return `"${dataType}"`;
	}
}

const dataTypesWithoutSql = [
	"bigint",
	"bigserial",
	"boolean",
	"bytea",
	"date",
	"double precision",
	"integer",
	"json",
	"jsonb",
	"real",
	"serial",
	"text",
	"time",
	"numeric",
	"uuid",
	"timestamp",
];

const dataTypesWithSql = [
	"smallint",
	"character",
	"bit varying",
	"character varying",
	"time with time zone",
	"timestamp with time zone",
	"tsvector",
	"tsquery",
	"xml",
	"bit",
	"varbit",
	"inet",
	"cidr",
	"macaddr",
	"macaddr8",
];

export interface DefaultValueAndHash {
	value?: string;
	hash?: string;
}

export function toValueAndHash(value: string) {
	const match = value.match(/(\w+):(.+)/);

	const valueAndHash: DefaultValueAndHash = {};

	if (match !== null && match[1] !== undefined && match[2] !== undefined) {
		valueAndHash.hash = match[1];
		valueAndHash.value = match[2];
	}
	return valueAndHash;
}
