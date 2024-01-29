import { TableSchema, pgTable } from "./table.js";

export type TableRecord<
	T extends Record<string, pgTable<string, TableSchema>>,
> = {
	[K in keyof T]: K extends string
		? T[K] extends TableSchema
			? pgTable<
					K,
					{
						columns: T[K]["columns"];
					}
			  >
			: never
		: never;
};

export type pgDatabase<O extends TableRecord<O>> = {
	tables?: O;
};

export function pgDatabase<O extends TableRecord<O>>(tables: O) {
	const database = <pgDatabase<O>>{ tables: tables };
	return database;
}
