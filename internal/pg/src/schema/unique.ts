/**
 * @group Schema Definition
 * @category Indexes and Constraints
 */
export function unique<T extends string>(columns: T[]) {
	return new PgUnique(columns);
}

type UniqueConstraintOptions = {
	columns: string[];
	nullsDistinct: boolean;
};

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgUnique<T extends string> {
	/**
	 * @hidden
	 */
	protected isExternal: boolean;

	/**
	 * @hidden
	 */
	protected options: UniqueConstraintOptions;

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected columns: T[],
	) {
		this.isExternal = false;
		this.options = {
			columns: this.columns,
			nullsDistinct: true,
		};
	}

	nullsNotDistinct() {
		this.options.nullsDistinct = false;
		return this;
	}

	external() {
		this.isExternal = true;
		return this;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function uniqueConstraintOptions<T extends PgUnique<any>>(
	uniqueConstraint: T,
) {
	assertUniqueConstraintWithInfo(uniqueConstraint);
	return uniqueConstraint.options;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isExternalUnique<T extends PgUnique<any>>(uniqueConstraint: T) {
	assertUniqueConstraintWithInfo(uniqueConstraint);
	return uniqueConstraint.isExternal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertUniqueConstraintWithInfo<T extends PgUnique<any>>(
	val: T,
): asserts val is T & {
	options: UniqueConstraintOptions;
	isExternal: boolean;
} {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgUnique = PgUnique<any>;
