import type { ForeignKeyConstraintInfo } from "./database/foreign_key_constraint.js";
import type { PrimaryKeyConstraintInfo } from "./database/primary_key_constraint.js";
import type { UniqueConstraintInfo } from "./database/unique_constraint.js";

export function foreignKeyConstraintInfoToQuery(
	info: ForeignKeyConstraintInfo,
) {
	return [
		`"${info.table}_${info.column.join("_")}_${
			info.targetTable
		}_${info.targetColumns.join("_")}_kinetic_fk"`,
		"FOREIGN KEY",
		`(${info.column.map((col) => `"${col}"`).join(", ")})`,
		"REFERENCES",
		info.targetTable,
		`(${info.targetColumns.map((col) => `"${col}"`).join(", ")})`,
		`ON DELETE ${info.deleteRule}`,
		`ON UPDATE ${info.updateRule}`,
	].join(" ");
}

export function primaryKeyConstraintInfoToQuery(
	info: PrimaryKeyConstraintInfo,
) {
	return [
		`"${info.table}_${info.columns.join("_")}_kinetic_pk"`,
		"PRIMARY KEY",
		`(${info.columns.map((col) => `"${col}"`).join(", ")})`,
	].join(" ");
}

export function uniqueConstraintInfoToQuery(info: UniqueConstraintInfo) {
	return [
		`"${info.table}_${info.columns.sort().join("_")}_kinetic_key"`,
		"UNIQUE",
		info.nullsDistinct ? "NULLS DISTINCT" : "NULLS NOT DISTINCT",
		`(${info.columns
			.sort()
			.map((col) => `"${col}"`)
			.join(", ")})`,
	].join(" ");
}
