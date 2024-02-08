export function primaryKey<T>(columns: keyof T | Array<keyof T>) {
	return new PgPrimaryKey(columns);
}
export class PgPrimaryKey<T> {
	cols: keyof T | Array<keyof T>;
	constructor(cols: keyof T | Array<keyof T>) {
		this.cols = cols;
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
