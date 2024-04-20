import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import type {
	ForeignKeyIntrospection,
	ForeignKeyRule,
} from "~/database/schema/introspect-table.js";
import {
	currentColumName,
	previousColumnName,
} from "~/introspection/column-name.js";
import {
	currentTableName,
	previousTableName,
} from "~/introspection/table-name.js";
import type { ColumnsToRename } from "~/programs/column-diff-prompt.js";
import type { TablesToRename } from "~/programs/table-diff-prompt.js";
import { hashValue } from "~/utils.js";

interface BuilderContext {
	camelCase: CamelCaseOptions;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
}

type BuildMode = "current" | "previous";

export class ForeignKeyBuilder {
	static fromStatement(
		tableName: string,
		statement: string,
		context: BuilderContext,
	) {
		const targetTable = currentTableName(
			statement.match(/REFERENCES (\w+)/)?.[1] || "",
			context.tablesToRename,
		);

		const deleteRule =
			statement.match(
				/ON DELETE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
			)?.[1] || "";

		const updateRule =
			statement.match(
				/ON UPDATE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
			)?.[1] || "";

		const foreignKey: ForeignKeyIntrospection = {
			targetTable,
			columns: (statement.match(/FOREIGN KEY \(((\w|,|\s|")+)\)/)?.[1] || "")
				.replace(/ /g, "")
				.replace(/"/g, "")
				.split(","),
			targetColumns: (
				statement.match(/REFERENCES \w+ \(((\w|,|\s|")+)\)/)?.[1] || ""
			)
				.replace(/ /g, "")
				.replace(/"/g, "")
				.split(","),
			deleteRule: deleteRule as ForeignKeyRule,
			updateRule: updateRule as ForeignKeyRule,
			isExternal: false,
		};
		return new ForeignKeyBuilder(tableName, foreignKey, context);
	}

	constructor(
		private table: string,
		private foreignKey: ForeignKeyIntrospection,
		private context: BuilderContext,
	) {
		this.foreignKey = Object.fromEntries(
			Object.entries(foreignKey),
		) as ForeignKeyIntrospection;
	}

	static statementToForeignKey(
		tableName: string,
		statement: string,
		tablesToRename: TablesToRename,
		columnsToRename: ColumnsToRename,
		mode: BuildMode,
	) {
		const renameTableFn =
			mode === "current" ? currentTableName : previousTableName;
		const renameColumnFn =
			mode === "current" ? currentColumName : previousColumnName;

		const targetTable = renameTableFn(
			statement.match(/REFERENCES (\w+)/)?.[1] || "",
			tablesToRename,
		);
		return {
			table: tableName,
			targetTable,
			columns: (statement.match(/FOREIGN KEY \(((\w|,|\s|")+)\)/)?.[1] || "")
				.replace(/ /g, "")
				.replace(/"/g, "")
				.split(",")
				.map((col) => renameColumnFn(tableName, col, columnsToRename)),
			targetColumns: (
				statement.match(/REFERENCES \w+ \(((\w|,|\s|")+)\)/)?.[1] || ""
			)
				.replace(/ /g, "")
				.replace(/"/g, "")
				.split(",")
				.map((col) => renameColumnFn(targetTable, col, columnsToRename)),
			deleteRule:
				statement.match(
					/ON DELETE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
				)?.[1] || "",
			updateRule:
				statement.match(
					/ON UPDATE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)/,
				)?.[1] || "",
		};
	}

	static toStatement(foreignKey: ForeignKeyIntrospection) {
		return [
			"FOREIGN KEY",
			`(${foreignKey.columns.map((col) => `"${col}"`).join(", ")})`,
			"REFERENCES",
			foreignKey.targetTable,
			`(${foreignKey.targetColumns.map((col) => `"${col}"`).join(", ")})`,
			`ON DELETE ${foreignKey.deleteRule ?? null}`,
			`ON UPDATE ${foreignKey.updateRule ?? null}`,
		].join(" ");
	}

	build(mode: BuildMode) {
		const key = this.key(mode);
		const intro = this.introspect(mode);
		return {
			key,
			query: this.query(mode),
			definition: {
				name: `${this.table}_${key}_yount_fk`,
				columns: intro.columns,
				targetTable: intro.targetTable,
				targetColumns: intro.targetColumns,
				onDelete: intro.deleteRule!.toLowerCase() as ForeignKeyRule,
				onUpdate: intro.updateRule!.toLowerCase() as ForeignKeyRule,
			},
		};
	}

	introspect(mode: BuildMode) {
		const renameTableFn =
			mode === "current" ? currentTableName : previousTableName;
		const renameColumnFn =
			mode === "current" ? currentColumName : previousColumnName;
		return {
			...this.foreignKey,
			targetTable: renameTableFn(
				toSnakeCase(this.foreignKey.targetTable, this.context.camelCase),
				this.context.tablesToRename,
			),
			columns: this.foreignKey.columns.map((col) => {
				return renameColumnFn(
					this.table!,
					toSnakeCase(col, this.context.camelCase),
					this.context.columnsToRename,
				);
			}),
			targetColumns: this.foreignKey.targetColumns.map((col) => {
				return renameColumnFn(
					toSnakeCase(this.foreignKey.targetTable!, this.context.camelCase),
					toSnakeCase(col, this.context.camelCase),
					this.context.columnsToRename,
				);
			}),
		};
	}

	query(mode: BuildMode) {
		return ForeignKeyBuilder.toStatement(this.introspect(mode));
	}

	key(mode: BuildMode) {
		const query = this.query(mode);
		return hashValue(query);
	}
}
