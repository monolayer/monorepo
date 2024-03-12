export function primaryKey<T extends string, PK extends string>(
	columns: (PK | T)[],
) {
	return new PgPrimaryKey<T, PK>(columns);
}

export class PgPrimaryKey<T extends string, PK extends string> {
	/**
	 * @hidden
	 */
	constructor(protected columns: (PK | T)[]) {}
}
