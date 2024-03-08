export type PgUnique<T> = {
	columns: T[];
	nullsDistinct: boolean;
	compileArgs(): {
		cols: string[];
		nullsDistinct: boolean;
	};
	nullsNotDistinct: () => PgUnique<T>;
};

export function pgUnique<T extends PropertyKey>(columns: T[]) {
	const unique: PgUnique<T> = {
		columns,
		nullsDistinct: true,
		nullsNotDistinct() {
			unique.nullsDistinct = false;
			return unique;
		},
		compileArgs() {
			return {
				cols: unique.columns as string[],
				nullsDistinct: unique.nullsDistinct,
			};
		},
	};
	return unique;
}
