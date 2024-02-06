export function pgUniqueConstraint(columns: string[], nullsDistinct = true) {
	return new PgUniqueConstraint(columns, nullsDistinct);
}
export class PgUniqueConstraint {
	constructor(
		public columns: string[],
		public nullsDistinct = true,
	) {}
}
