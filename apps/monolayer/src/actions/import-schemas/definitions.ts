import { uniqueConstraintDefinitionFromString } from "@monorepo/pg/changeset/generators/unique.js";
import { extractColumnsFromPrimaryKey } from "@monorepo/pg/introspection/schema.js";
import type { ForeignKeyIntrospection } from "@monorepo/pg/introspection/table.js";

export function primaryKeyDefinition(rawColumns: string) {
	const columns = extractColumnsFromPrimaryKey(rawColumns).sort();
	return `primaryKey([${columns.map((column) => `"${column}"`).join(", ")}])`;
}

export function foreignKeyDefinition(foreignKey: ForeignKeyIntrospection) {
	const columns = foreignKey.columns
		.toSorted()
		.map((column) => `"${column}"`)
		.join(", ");
	const targetColumns = foreignKey.targetColumns
		.map((column) => `"${column}"`)
		.join(", ");
	const targetTable = !foreignKey.targetTable.includes(".")
		? foreignKey.targetTable
		: `"${foreignKey.targetTable.split(".").at(1)}"`;
	const deleteRule = foreignKey.deleteRule ?? "NO ACTION";
	const updateRule = foreignKey.updateRule ?? "NO ACTION";

	return `unmanagedForeignKey([${columns}], "${targetTable.replace(/"/g, "")}", [${targetColumns}]).deleteRule("${deleteRule}").updateRule("${updateRule}")`;
}

export function uniqueConstraintDefinition(unique: string) {
	const uniqueConstraint = uniqueConstraintDefinitionFromString(
		unique,
		"sample",
		"sample",
	);

	return [
		`unique([${uniqueConstraint.columns
			.sort()
			.map((column) => `"${column}"`)
			.join(", ")}])`,
		uniqueConstraint.distinct ? undefined : ".nullNotDistinct()",
		"external()",
	]
		.filter((part) => part !== undefined)
		.join(".");
}

export function checkConstraintDefinition(name: string, check: string) {
	return `unmanagedCheck("${name}", sql\`${check}\`)`;
}

export function indexDefinition(name: string, index: string) {
	return `unmanagedIndex("${name}", sql\`${index}\`)`;
}

export function triggerDefinition(name: string, trigger: string) {
	return `unmanagedTrigger("${name}", sql\`${trigger}\`)`;
}
