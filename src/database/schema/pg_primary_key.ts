export function pgPrimaryKeyConstraint(columns: string[]) {
	return new PgPrimaryKeyConstraint(columns);
}
export class PgPrimaryKeyConstraint {
	constructor(public columns: string[]) {}
}
