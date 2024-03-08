export function pgUnique<T extends PropertyKey>(columns: T[]) {
	return new PgUnique(columns);
}

export class PgUnique<T> {
	constructor(
		private columns: T[],
		private nullsDistinct = true,
	) {}

	nullsNotDistinct() {
		this.nullsDistinct = false;
		return this;
	}

	compileArgs() {
		return {
			cols: this.columns as string[],
			nullsDistinct: this.nullsDistinct,
		};
	}
}
