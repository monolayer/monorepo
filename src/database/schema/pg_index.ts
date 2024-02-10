import { CreateIndexBuilder } from "kysely";

type IndexBuilder = (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	builder: CreateIndexBuilder<any> & {
		column: never;
		columns: never;
		ifNotExists: never;
	},
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
) => CreateIndexBuilder<any>;

export function index<T>(columns: T, builder: IndexBuilder) {
	return new PgIndex(columns, builder);
}

export class PgIndex<T> {
	cols: T;
	_builder: IndexBuilder;

	constructor(cols: T, builder: IndexBuilder) {
		this.cols = cols;
		this._builder = builder;
	}

	get columns() {
		const colArray = [] as string[];
		if (typeof this.cols === "string") {
			colArray.push(this.cols);
		} else {
			colArray.push(...(this.cols as unknown as string[]));
		}
		return colArray;
	}
}
