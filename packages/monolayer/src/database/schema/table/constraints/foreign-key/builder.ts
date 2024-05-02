import { Kysely, PostgresDialect, type OnModifyForeignAction } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import type { ForeignKeyIntrospection } from "~/database/schema/introspect-table.js";
import {
	currentColumName,
	previousColumnName,
} from "~/introspection/column-name.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~/introspection/introspect-schemas.js";
import {
	currentTableName,
	previousTableName,
} from "~/introspection/table-name.js";
import { hashValue } from "~/utils.js";

interface BuilderContext {
	camelCase: CamelCaseOptions;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
}

type BuildMode = "current" | "previous" | "preserve";

export class ForeignKeyBuilder {
	constructor(
		private table: string,
		private foreignKey: ForeignKeyIntrospection,
		private context: BuilderContext,
	) {
		this.foreignKey = Object.fromEntries(
			Object.entries(foreignKey),
		) as ForeignKeyIntrospection;
	}

	hash(mode: BuildMode) {
		const key = [
			this.#tableName(mode),
			this.#columns(mode).join(","),
			this.#targetTableName(mode),
			this.#targetColumns(mode).join(","),
			this.#onDelete(),
			this.#onUpdate(),
		].join("-");
		return hashValue(key);
	}

	definition(mode: BuildMode, name?: string) {
		const foreignKeyTable = this.#tableName(mode);
		return {
			name: name ?? `${foreignKeyTable}_${this.hash(mode)}_monolayer_fk`,
			columns: this.#columns(mode),
			targetTable: this.#targetTableName(mode),
			targetColumns: this.#targetColumns(mode),
			onDelete: this.#onDelete(),
			onUpdate: this.#onUpdate(),
		} as ForeignKeyDefinition;
	}

	build(mode: BuildMode, name?: string) {
		const definition = this.definition(mode, name);
		return this.#db()
			.schema.alterTable(this.#tableName(mode))
			.addForeignKeyConstraint(
				definition.name,
				definition.columns,
				definition.targetTable,
				definition.targetColumns,
			)
			.onDelete(definition.onDelete as OnModifyForeignAction)
			.onUpdate(definition.onUpdate as OnModifyForeignAction)
			.compile().sql;
	}

	#db() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const db = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: new pg.Pool({}),
			}),
		});
		return db;
	}

	#renameTableFn(mode: Extract<BuildMode, "current" | "previous">) {
		return mode === "current" ? currentTableName : previousTableName;
	}

	#renameColumnFn(mode: Extract<BuildMode, "current" | "previous">) {
		return mode === "current" ? currentColumName : previousColumnName;
	}

	#tableName(mode: BuildMode) {
		return mode === "preserve"
			? this.table
			: this.#renameTableFn(mode)(
					toSnakeCase(this.table, this.context.camelCase),
					this.context.tablesToRename,
				);
	}

	#targetTableName(mode: BuildMode) {
		return mode === "preserve"
			? this.foreignKey.targetTable
			: this.#renameTableFn(mode)(
					toSnakeCase(this.foreignKey.targetTable, this.context.camelCase),
					this.context.tablesToRename,
				);
	}

	#columns(mode: BuildMode) {
		return this.foreignKey.columns.toSorted().map((col) => {
			return mode === "preserve"
				? col
				: this.#renameColumnFn(mode)(
						this.#tableName(mode),
						toSnakeCase(col, this.context.camelCase),
						this.context.columnsToRename,
					);
		});
	}

	#targetColumns(mode: BuildMode) {
		return this.foreignKey.targetColumns.toSorted().map((col) => {
			return mode === "preserve"
				? col
				: this.#renameColumnFn(mode)(
						this.#targetTableName(mode),
						toSnakeCase(col, this.context.camelCase),
						this.context.columnsToRename,
					);
		});
	}

	#onDelete() {
		const rule = this.foreignKey.deleteRule?.toLowerCase() ?? "no action";
		return rule as OnModifyForeignAction;
	}

	#onUpdate() {
		const rule = this.foreignKey.updateRule?.toLowerCase() ?? "no action";
		return rule as OnModifyForeignAction;
	}
}

export type ForeignKeyDefinition = {
	name: string;
	columns: string[];
	targetTable: string;
	targetColumns: string[];
	onDelete: string;
	onUpdate: string;
};
