import type { ColumnDataType, OnModifyForeignAction } from "kysely";
import { ColumnInfo, ColumnUnique } from "./pg_column.js";
import { pgTable } from "./table.js";

export class PgColumnBase<S, I, U> {
	protected info: Omit<ColumnInfo, "columnName" | "tableName">;

	constructor(dataType: ColumnDataType) {
		this.info = {
			dataType: dataType,
			isNullable: null,
			defaultValue: null,
			characterMaximumLength: null,
			numericPrecision: null,
			numericScale: null,
			datetimePrecision: null,
			renameFrom: null,
			primaryKey: null,
			foreignKeyConstraint: null,
			identity: null,
			unique: null,
		};
	}

	renameFrom(name: string) {
		this.info.renameFrom = name;
		return this;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	references<R extends pgTable<string, any>>(
		table: R,
		column: keyof R["columns"],
		options?: {
			onDelete?: OnModifyForeignAction;
			onUpdate?: OnModifyForeignAction;
		},
	): this {
		this.info.foreignKeyConstraint = {
			table: table.name,
			column: column.toString(),
			options: `${
				options?.onDelete !== undefined ? options.onDelete : "no action"
			};${options?.onUpdate !== undefined ? options.onUpdate : "no action"}`,
		};
		return this;
	}

	unique() {
		this.info.unique = ColumnUnique.NullsDistinct;
		return this;
	}

	nullsNotDistinct() {
		if (this.info.unique !== null) {
			this.info.unique = ColumnUnique.NullsNotDistinct;
		}
		return this;
	}
}
