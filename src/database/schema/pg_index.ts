import { CreateIndexBuilder } from "kysely";

type IndexBuilder = (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	builder: CreateIndexBuilder<any> & {
		column: never;
		columns: never;
	},
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
) => CreateIndexBuilder<any>;

export function index<T>(columns: T, builder: IndexBuilder) {
	return new PgIndex(columns, builder);
}

export class PgIndex<T> {
	_builder: IndexBuilder;

	constructor(
		private cols: T,
		builder: IndexBuilder,
	) {
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
