import type { TablesToRename } from "~/introspection/introspect-schemas.js";

export function previousTableName(
	changedTableName: string,
	tablesToRename: TablesToRename,
	schemaName: string = "public",
) {
	const previousName = tablesToRename.find((table) => {
		return table.to === `${schemaName}.${changedTableName}`;
	})?.from;

	return previousName === undefined
		? changedTableName
		: previousName.split(".")[1]!;
}

export function currentTableName(
	previousTableName: string,
	tablesToRename: TablesToRename,
	schemaName: string,
) {
	const currentName = tablesToRename.find((table) => {
		return table.from === `${schemaName}.${previousTableName}`;
	})?.to;

	return currentName === undefined
		? previousTableName
		: currentName.split(".")[1]!;
}
