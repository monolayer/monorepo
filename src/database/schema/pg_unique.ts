export function unique<T>(columns: T) {
	return new PgUnique(columns);
}

export class PgUnique<T> {
	#compileArgs: {
		cols: string[];
		nullsDistinct: boolean;
	};

	constructor(cols: T) {
		const colArray = [] as string[];
		if (typeof cols === "string") {
			colArray.push(cols);
		} else {
			colArray.push(...(cols as unknown as string[]));
		}

		this.#compileArgs = {
			cols: colArray,
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
