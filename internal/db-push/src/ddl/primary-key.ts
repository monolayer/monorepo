import { extractColumnsFromPrimaryKey } from "@monorepo/pg/introspection/schema.js";
import {
	primaryKeyColumnDetails,
	type AnyKysely,
	type ColumnExists,
} from "../changeset/introspection.js";
import { ChangeWarningType } from "../changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "../changeset/warnings/codes.js";
import type { ChangeWarning } from "../changeset/warnings/warnings.js";
import type { ChangesetGenerator } from "../state/changeset-generator.js";
import {
	createCheckConstraint,
	createIndexConcurrently,
	createPrimaryKeyWithIndex,
	dropCheckConstraint,
	dropIndex,
	dropPrimaryKey,
} from "./ddl.js";

export class OnlinePrimaryKey {
	index: PrimaryKeyIndex;
	#context: ChangesetGenerator;

	constructor(
		public table: string,
		public name: string,
		public primaryKeyValue: string,
		context: ChangesetGenerator,
	) {
		this.#context = context;
		this.index = new PrimaryKeyIndex(this.schema, table, primaryKeyValue);
	}

	get schema() {
		return this.#context.schemaName;
	}
	get up() {
		return async (db: AnyKysely) => {
			for (const check of this.#checks) {
				await check(db);
			}
			await createPrimaryKeyWithIndex({
				schemaName: this.schema,
				tableName: this.table,
				name: this.name,
				indexName: this.index.name,
				debug: true,
			})(db);
			for (const check of this.#dropChecks) {
				await check(db);
			}
		};
	}

	get down() {
		return dropPrimaryKey({
			schemaName: this.schema,
			tableName: this.table,
			name: this.name,
			debug: false,
		});
	}

	get warnings() {
		const warnings: ChangeWarning[] = [];

		const existingNullableColumns = Object.values(this.columnDetails).filter(
			(details) => details.inDb.exists && details.inDb.nullable,
		);
		const newColumns = Object.values(this.columnDetails).filter(
			(details) => !details.inDb.exists && details.inTable.exists,
		);
		if (existingNullableColumns.length > 0) {
			warnings.push({
				type: ChangeWarningType.MightFail,
				code: ChangeWarningCode.AddPrimaryKeyToExistingNullableColumn,
				schema: this.schema,
				table: this.table,
				columns: existingNullableColumns.map((col) => col.columnName),
			});
		}
		if (newColumns.length > 0) {
			warnings.push({
				type: ChangeWarningType.MightFail,
				code: ChangeWarningCode.AddPrimaryKeyToNewColumn,
				schema: this.schema,
				table: this.table,
				columns: newColumns.map((col) => col.columnName),
			});
		}
		return warnings;
	}
	get columnDetails(): Record<string, PrimaryKeyColumnDetails> {
		return primaryKeyColumnDetails(this.table, this.#columns, this.#context);
	}

	get #checks() {
		return this.#columns.flatMap((column) => {
			const inDb = this.columnDetails[column];
			if (inDb !== undefined && inDb.inDb.exists && !inDb.inDb.nullable) {
				return [];
			} else {
				return createCheckConstraint({
					check: {
						schemaName: this.schema,
						tableName: this.table,
						name: `${column}_temporary_not_null_check_constraint`,
						definition: `"${column}" IS NOT NULL`,
					},
					debug: true,
				});
			}
		});
	}

	get #dropChecks() {
		return this.#columns.flatMap((column) => {
			const inDb = this.columnDetails[column];
			if (inDb !== undefined && inDb.inDb.exists && !inDb.inDb.nullable) {
				return [];
			} else {
				return dropCheckConstraint({
					check: {
						schemaName: this.schema,
						tableName: this.table,
						name: `${column}_temporary_not_null_check_constraint`,
					},
					debug: true,
				});
			}
		});
	}

	get #columns() {
		return extractColumnsFromPrimaryKey(this.primaryKeyValue);
	}
}

export class PrimaryKeyIndex {
	name: string;

	constructor(
		public schema: string,
		public table: string,
		public primaryKeyValue: string,
	) {
		this.name = `${this.table}_pkey_idx`;
	}

	get up() {
		return createIndexConcurrently({
			schemaName: this.schema,
			name: this.name,
			definition: `create unique index concurrently "${this.name}" on "${this.schema}"."${this.table}" ${this.primaryKeyValue}`,
			debug: true,
		});
	}

	get down() {
		return dropIndex({
			schemaName: this.schema,
			name: this.name,
			debug: true,
		});
	}
}

interface PrimaryKeyColumnDetails {
	columnName: string;
	inDb: ColumnExists;
	inTable: ColumnExists;
}
