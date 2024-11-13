import color from "picocolors";
import type { CodeChangesetWarning } from "./types/changeset.js";

export function printWarning(opts: CodeChangesetWarning) {
	console.log("");
	console.log(`${color.bgYellow(color.black(" WARNING "))} ${opts.header}`);
	console.log(opts.notes.join("\n"));
	console.log("");
}

export const addBigSerialColumn = {
	header: "Database blocking changes detected",
	notes: [
		"Adding a bigserial column to an existing table will cause the entire table to be rewritten.",
		"Other transactions will not be able to read and write to the table until the rewrite is finished.",
		"",
		"Downtime for your application can only be avoided by using a safer but complex approach:",
		"  1. Create a new table with a new name.",
		"  2. Write to both tables (old and new).",
		"  3. Backfill data from the old table to the new table.",
		"  4. Move reads from the old table to the new table.",
		"  5. Stop writing to the old table.",
		"  6. Drop the old table.",
	],
};

export const addNonNullableColumnWarning = {
	header: "Schema change might fail",
	notes: [
		"Adding a non nullable column may fail if the column contains `NULL` values.",
		"",
		"How to prevent a migration failure and application downtime:",
		"  1. Add a non-volatile default value to the column.",
	],
};

export const addPrimaryKeyToExistingNullableColumn = {
	header: "Schema change might fail",
	notes: [
		"Adding a primary key constraint to existing nullable column(s) may fail if the column",
		"contains `NULL` values or duplicate entries.",
		"",
		"How to prevent a migration failure and application downtime:",
		"  1. Ensure the column does not have duplicate entries.",
		"  2. Replace `NULL` values in the column with unique values.",
		"  3. Ensure existing applications do not insert `NULL` or duplicate entries into the column.",
		"  4. Create the primary key.",
	],
};

export const addPrimaryKeyToNewColumn = {
	header: "Schema change might fail",
	notes: [
		"Adding a primary key constraint to a new column on an existing table",
		"may fail if the column contains `NULL` values or duplicate entries.",
		"",
		"How to prevent a migration failure and application downtime:",
		"  1. Add the column to the database as nullable.",
		"  2. Populate it with unique values.",
		"  3. Ensure applications do not insert `NULL` or duplicate entries into it.",
		"  4. Create the primary key.",
	],
};

export const addSerialColumn = {
	header: "Blocking changes",
	notes: [
		"Adding a serial column to an existing table will cause the entire table to be rewritten.",
		"Other transactions will not be able to read and write to the table until the rewrite is finished.",
		"",
		"Downtime for your application can only be avoided by using a safer but complex approach:",
		"  1. Create a new table with a new name.",
		"  2. Write to both tables (old and new).",
		"  3. Backfill data from the old table to the new table.",
		"  4. Move reads from the old table to the new table.",
		"  5. Stop writing to the old table.",
		"  6. Drop the old table.",
	],
};

export const addUniqueToExisitingColumnWarning = {
	header: "Schema change might fail",
	notes: [
		"Adding a unique constraint to an existing column may fail if the column",
		"contains duplicate entries.",
		"",
		"How to prevent a migration failure and application downtime:",
		"  1. Ensure the column does not have duplicate entries.",
		"  2. Ensure existing applications do not insert duplicate entries into the column.",
		"  3. Create the unique constraint.",
	],
};

export const changeColumnDefaultVolatileWarning = {
	header: "Blocking change",
	notes: [
		"If the new default is a volatile function, it will cause the entire table to be rewritten.",
		"Other transactions will not be able to read and write to the table until the rewrite is finished.",
		"",
		"Downtime for your application can be avoided by using a safer but complex approach:",
		"  1. Create a new column with the new name.",
		"  2. Write to both columns (old and new).",
		"  3. Backfill data from the old column to the new column.",
		"  4. Move reads from the old column to the new column.",
		"  5. Stop writing to the old column.",
		"  6. Drop the old column.",
	],
};

export const changeColumnToNonNullableWarning = {
	header: "Schema change might fail",
	notes: [
		"Making a column non-nullable on an existing table may fail if the column contains `NULL` values.",
		"",
		"How to prevent a migration failure and application downtime:",
		"  1. Remove `NULL` values from the column.",
		"  2. Ensure existing applications always insert non `NULL` values into the column.",
		"  3. Make the column non-nullable.",
	],
};

export const changeColumnTypeWarning = {
	header: "Blocking change",
	notes: [
		"The column data type change will cause the entire table and indexes on changed columns to be rewritten",
		"Other transactions will not be able to read and write to the table until the rewrite is finished.",
		"",
		"Downtime for your application can be avoided by using a safer but complex approach:",
		"  1. Create a new column with the new name.",
		"  2. Write to both columns (old and new).",
		"  3. Backfill data from the old column to the new column.",
		"  4. Move reads from the old column to the new column.",
		"  5. Stop writing to the old column.",
		"  6. Drop the old column.",
	],
};

export const columnRenameWarning = {
	header: "Blocking change",
	notes: [
		"Renaming a column will disrupt running applications that rely on the old column name.",
		"",
		"Downtime for your application can be avoided by using a safer but complex approach:",
		"  1. Create a new column with the new name.",
		"  2. Write to both columns (old and new).",
		"  3. Backfill data from the old column to the new column.",
		"  4. Move reads from the old column to the new column.",
		"  5. Stop writing to the old column.",
		"  6. Drop the old column.",
	],
};

export const destructiveWarning = {
	header: "Destructive change",
	notes: [
		"These changes may result in a data loss and will prevent existing applications",
		"that rely on the dropped objects from functioning correctly.\n",
		"You can avoid this by:",
		"1. Deploy an application version that does not reference dropped object.",
		"2. Deploy an application version with a schema that drops the object.",
	],
};

export const tableRenameWarning = {
	header: "Table rename",
	notes: [
		"Downtime for your application can only be avoided by using a safer but complex approach:",
		"  1. Create a new table with the new name.",
		"  2. Write to both tables (old and new).",
		"  3. Backfill data from the old table to the new table.",
		"  4. Move reads from the old table to the new table.",
		"  5. Stop writing to the old table.",
		"  6. Drop the old table.",
	],
};
