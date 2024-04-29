import type { TablesToRename } from "~/introspection/introspect-schemas.js";

export function previousTableName(
	changedTableName: string,
	tablesToRename: TablesToRename,
) {
	return (
		tablesToRename.find((table) => {
			return table.to === changedTableName;
		})?.from || changedTableName
	);
}

export function currentTableName(
	previousTableName: string,
	tablesToRename: TablesToRename,
) {
	return (
		tablesToRename.find((table) => {
			return table.from === previousTableName;
		})?.to || previousTableName
	);
}
