export function pgUniqueConstraint<T>(columns: T, nullsDistinct = true) {
	const cols = [] as string[];
	if (typeof columns === "string") {
		cols.push(columns);
	} else {
		cols.push(...(columns as unknown as string[]));
	}
	return new PgUniqueConstraint(columns, nullsDistinct);
}
export class PgUniqueConstraint<T> {
	constructor(
		private cols: T,
		public nullsDistinct = true,
	) {}

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
