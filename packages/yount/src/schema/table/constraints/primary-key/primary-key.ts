export function primaryKey<T extends string, PK extends string>(
	columns: (PK | T)[],
) {
	return new PgPrimaryKey<T, PK>(columns);
}

export class PgPrimaryKey<T extends string, PK extends string> {
	/**
	 * @hidden
	 */
	protected isExternal = false;

	/**
	 * @hidden
	 */
	static info(pk: AnyPgPrimaryKey) {
		return {
			columns: pk.columns,
			isExternal: pk.isExternal,
		};
	}

	/**
	 * @hidden
	 */
	constructor(protected columns: (PK | T)[]) {}

	/**
	 * @hidden
	 */
	external() {
		this.isExternal = true;
		return this;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgPrimaryKey = PgPrimaryKey<any, any>;
