import { extractColumnsFromPrimaryKey } from "@monorepo/pg/introspection/schema.js";
import type { ForeignKeyIntrospection } from "@monorepo/pg/introspection/table.js";
import { uniqueConstraintDefinitionFromString } from "@monorepo/pg/introspection/unique.js";

export function primaryKeyDefinition(rawColumns: string) {
	const columns = extractColumnsFromPrimaryKey(rawColumns).sort();
	return `primaryKey([${columns.map((column) => `"${column}"`).join(", ")}])`;
}

export function foreignKeyDefinition(
	schemaName: string,
	tableName: string,
	fkHash: string,
	foreignKey: ForeignKeyIntrospection,
) {
	const columns = foreignKey.columns
		.toSorted()
		.map((column) => `"${column}"`)
		.join(", ");
	const targetColumns = foreignKey.targetColumns
		.map((column) => `"${column}"`)
		.join(", ");
	const targetTable = !foreignKey.targetTable.includes(".")
		? foreignKey.targetTable
		: `${foreignKey.targetTable.split(".").at(1)}`;
	const deleteRule = foreignKey.deleteRule ?? "NO ACTION";
	const updateRule = foreignKey.updateRule ?? "NO ACTION";

	const definition = `FOREIGN KEY (${columns}) REFERENCES "${schemaName}"."${targetTable}" (${targetColumns}) ON DELETE ${deleteRule} ON UPDATE ${updateRule}`;
	return `mappedForeignKey("${tableName}_${fkHash}_monolayer_fk", sql\`${definition}\`)`;
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
	return `mappedCheck("${name}", sql\`${check}\`)`;
}

export function indexDefinition(name: string, index: string) {
	return `mappedIndex("${name}", sql\`${index}\`)`;
}

export function triggerDefinition(name: string, trigger: string) {
	return `mappedTrigger("${name}", sql\`${trigger}\`)`;
}
