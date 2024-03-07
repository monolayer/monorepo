export function pgUnique<T extends string>(columns: T[]) {
	return new PgUnique<T>(columns);
}

export class PgUnique<T extends string> {
	#compileArgs: {
		cols: T[];
		nullsDistinct: boolean;
	};

	constructor(cols: T[]) {
		this.#compileArgs = {
			cols: cols,
			nullsDistinct: true,
		};
	}

	nullsNotDistinct() {
		this.#compileArgs.nullsDistinct = false;
		return this;
	}

	compileArgs() {
		return this.#compileArgs;
	}
}
