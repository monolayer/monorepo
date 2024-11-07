import { currentColumName as currColumName } from "@monorepo/pg/introspection/column-name.js";
import { extractColumnsFromPrimaryKey } from "@monorepo/pg/introspection/schema.js";
import { hashValue } from "@monorepo/utils/hash-value.js";
import type { ChangesetGenerator } from "~push/state/changeset-generator.js";
import {
	resolveCurrentTableName,
	uniqueConstraintDefinitionFromString,
} from "../changeset/introspection.js";

export class GeneratorTable {
	#currentName?: string;

	constructor(
		public name: string,
		private context: ChangesetGenerator,
	) {}

	get currentName() {
		if (this.#currentName === undefined) {
			this.#currentName = resolveCurrentTableName(this.name, this.context);
		}
		return this.#currentName;
	}

	currentColumnName(columName: string) {
		return currColumName(
			this.name,
			this.context.schemaName,
			columName,
			this.context.columnsToRename,
		);
	}

	get primaryKey() {
		const pkInfo = Object.entries(
			this.context.local.primaryKey[this.currentName] ?? {},
		);
		if (pkInfo.length === 0) {
			return;
		} else {
			if (pkInfo.length > 1) {
				throw new Error("more than one primary key defined");
			}
			const primaryKey = pkInfo.at(0)!;
			return {
				name: primaryKey[0],
				columns: extractColumnsFromPrimaryKey(primaryKey[1]),
			};
		}
	}

	get uniqueConstraints() {
		const uniqueConstraintsInfo = Object.entries(
			this.context.local.uniqueConstraints[this.currentName] ?? {},
		);
		if (uniqueConstraintsInfo.length === 0) return [];

		return uniqueConstraintsInfo.map(([hash, value]) => {
			const uniqueConstraint = uniqueConstraintDefinitionFromString(
				value,
				this.currentName,
				hash,
			);
			return {
				name: `${this.currentName}_${hashValue(
					`${uniqueConstraint.distinct}_${uniqueConstraint.columns.sort().join("_")}`,
				)}_monolayer_key`,
				distinct: uniqueConstraint.distinct,
				columns: uniqueConstraint.columns.map((col) =>
					this.currentColumnName(col),
				),
			};
		});
	}

	get redundantUniqueConstraints() {
		return this.uniqueConstraints.filter((c) =>
			this.isRedundantUniqueConstraint(c),
		);
	}

	isRedundantUniqueConstraint(uniqueConstraint: {
		name: string;
		distinct: boolean;
		columns: string[];
	}) {
		return (
			this.primaryKey !== undefined &&
			uniqueConstraint.columns.every((col) =>
				this.primaryKey?.columns.includes(col),
			) &&
			uniqueConstraint.distinct
		);
	}
}
