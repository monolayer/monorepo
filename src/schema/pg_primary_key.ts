export function pgPrimaryKey<T extends string, PK extends string>(
	columns: (PK | T)[],
) {
	return new PgPrimaryKey<T, PK>(columns);
}

export class PgPrimaryKey<T extends string, PK extends string> {
	constructor(protected columns: (PK | T)[]) {}
}
