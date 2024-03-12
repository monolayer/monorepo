export function unique<T extends string>(columns: T[]) {
	return new PgUnique(columns);
}

type UniqueConstraintOptions = {
	columns: string[];
	nullsDistinct: boolean;
};

export class PgUnique<T extends string> {
	protected options: UniqueConstraintOptions;

	constructor(protected columns: T[]) {
		this.options = {
			columns: this.columns,
			nullsDistinct: true,
		};
	}

	nullsNotDistinct() {
		this.options.nullsDistinct = false;
		return this;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function uniqueConstraintOptions<T extends PgUnique<any>>(
	uniqueConstraint: T,
) {
	assertUniqueConstraintWithOptions(uniqueConstraint);
	return uniqueConstraint.options;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertUniqueConstraintWithOptions<T extends PgUnique<any>>(
	val: T,
): asserts val is T & { options: UniqueConstraintOptions } {
	true;
}
