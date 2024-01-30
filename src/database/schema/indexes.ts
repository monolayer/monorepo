import { CreateIndexBuilder } from "kysely";
import {
	ColumnConstructor,
	pgBoolean,
	pgVarchar,
} from "~/database/schema/columns.js";
import { pgTable } from "./table.js";

export type IndexConstructor<T> = {
	new (): T;
	(): T;
};

export type pgIndex = object;

export function pgIndex(
	name: string,
	builder: (builder: CreateIndexBuilder) => CreateIndexBuilder,
) {
	const indexConstructor = function (this: pgIndex) {
		const meta = {
			name,
			builder,
		};
		Object.defineProperty(this, "_meta", {
			value: meta,
			writable: false,
		});
		return this;
	} as ColumnConstructor<pgIndex>;
	return new indexConstructor();
}

export type IndexMeta = {
	name: string;
	builder: (builder: CreateIndexBuilder) => CreateIndexBuilder;
};

export function indexMeta(obj: object) {
	return (
		obj as unknown as {
			_meta: IndexMeta;
		}
	)._meta;
}

export const table = pgTable("users", {
	columns: {
		name: pgVarchar(),
		subscribed: pgBoolean(),
	},
	indexes: [
		pgIndex("index_on_name", (idx) =>
			idx.ifNotExists().unique().using("btree"),
		),
		pgIndex("index_on_subscribe", (idx) =>
			idx.ifNotExists().unique().using("btree"),
		),
	],
});
