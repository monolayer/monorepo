export function primaryKey<PK extends string>(columns: PK[]) {
	return new PgPrimaryKey(columns);
}

export class PgPrimaryKey<PK> {
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
	constructor(protected columns: PK[]) {}

	/**
	 * @hidden
	 */
	external() {
		this.isExternal = true;
		return this;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgPrimaryKey = PgPrimaryKey<any>;
