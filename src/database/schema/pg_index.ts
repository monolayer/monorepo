import {
	type ComparisonOperatorExpression,
	type Expression,
	type ExpressionBuilder,
	type IndexType,
	type SqlBool,
} from "kysely";
import type { ShallowRecord } from "node_modules/kysely/dist/esm/util/type-utils.js";

function where<T>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	lhs: any | Expression<any>,
	op: ComparisonOperatorExpression,
	rhs: unknown,
): T;
function where<T>(
	factory: (
		qb: ExpressionBuilder<
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ShallowRecord<string, ShallowRecord<any & string, any>>,
			string
		>,
	) => Expression<SqlBool>,
): T;
function where<T>(expression: Expression<SqlBool>): T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function where<T>(...args: any[]): T {
	return args as T;
}

type CompileArgs = {
	ifNotExists: boolean;
	unique: boolean;
	nullsNotDistinct: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expression: Expression<any> | undefined;
	using: IndexType | string | undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	where: any[] | undefined;
	columns: string[];
};

export type PgIndex<T extends string> = {
	cols: T[];
	ifNotExists: () => PgIndex<T>;
	unique: () => PgIndex<T>;
	nullsNotDistinct: () => PgIndex<T>;
	expression: (expression: Expression<SqlBool>) => PgIndex<T>;
	using: (indexType: IndexType | string) => PgIndex<T>;
	where: typeof where<PgIndex<T>>;
	compileArgs: () => CompileArgs;
};

export function pgIndex<T extends string>(columns: T[]) {
	const compileArgs: CompileArgs = {
		ifNotExists: false,
		unique: false,
		nullsNotDistinct: false,
		expression: undefined,
		using: undefined,
		where: undefined,
		columns: columns as unknown as string[],
	};

	const index: PgIndex<T> = {
		cols: columns,
		ifNotExists: () => {
			compileArgs.ifNotExists = true;
			return index;
		},
		unique: () => {
			compileArgs.unique = true;
			return index;
		},
		nullsNotDistinct: () => {
			compileArgs.nullsNotDistinct = true;
			return index;
		},
		expression: (expression) => {
			compileArgs.expression = expression;
			return index;
		},
		using: (indexType) => {
			compileArgs.using = indexType;
			return index;
		},
		compileArgs: () => {
			return {
				ifNotExists: compileArgs.ifNotExists ?? false,
				unique: compileArgs.unique ?? false,
				nullsNotDistinct: compileArgs.nullsNotDistinct ?? false,
				expression: compileArgs.expression,
				using: compileArgs.using,
				where: compileArgs.where,
				columns:
					typeof columns === "string"
						? ([columns] as unknown as string[])
						: (columns as unknown as string[]),
			};
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		where: (...args: any[]) => {
			compileArgs.where = args;
			return index;
		},
	};
	return index;
}
