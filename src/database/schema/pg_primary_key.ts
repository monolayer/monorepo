export function pgPrimaryKeyConstraint<T>(columns: T) {
	return new PgPrimaryKeyConstraint(columns);
}
export class PgPrimaryKeyConstraint<T> {
	constructor(private cols: T) {}

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
