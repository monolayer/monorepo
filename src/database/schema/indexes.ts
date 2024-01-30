import { CreateIndexBuilder } from "kysely";
import { ColumnConstructor } from "~/database/schema/columns.js";

export type IndexConstructor<T> = {
	new (): T;
	(): T;
};

export type pgIndex = {
	readonly name: string;
};

export function pgIndex(
	name: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	builder: (builder: CreateIndexBuilder<any>) => CreateIndexBuilder<any>,
) {
	const indexConstructor = function (this: pgIndex) {
		Object.defineProperty(this, "name", {
			value: name,
			writable: false,
		});
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
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	builder: (builder: CreateIndexBuilder<any>) => CreateIndexBuilder<any>;
};

export function indexMeta(obj: object) {
	return (
		obj as unknown as {
			_meta: IndexMeta;
		}
	)._meta;
}
