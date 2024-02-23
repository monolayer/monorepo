import {
	type ComparisonOperatorExpression,
	type Expression,
	type ExpressionBuilder,
	type IndexType,
	type SqlBool,
} from "kysely";
import type { ShallowRecord } from "node_modules/kysely/dist/esm/util/type-utils.js";

export function index<T extends string>(columns: T | [T, ...T[]]) {
	return new PgIndex<T>(columns);
}

export class PgIndex<T extends string | string[]> {
	cols: T | [T, ...T[]];
	#compileArgs: {
		ifnotExists: boolean;
		unique: boolean;
		nullsNotDistinct: boolean;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		expression: Expression<any> | undefined;
		using: IndexType | string | undefined;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		where: any[] | undefined;
		columns: string[];
	};

	constructor(cols: T | [T, ...T[]]) {
		this.cols = cols;
		this.#compileArgs = {
			ifnotExists: false,
			unique: false,
			nullsNotDistinct: false,
			expression: undefined,
			using: undefined,
			where: undefined,
			columns:
				typeof cols === "string"
					? ([cols] as unknown as string[])
					: (cols as unknown as string[]),
		};
	}

	ifNotExists() {
		this.#compileArgs.ifnotExists = true;
		return this;
	}

	unique() {
		this.#compileArgs.unique = true;
		return this;
	}

	nullsNotDistinct() {
		this.#compileArgs.nullsNotDistinct = true;
		return this;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	expression(expression: Expression<any>) {
		this.#compileArgs.expression = expression;
		return this;
	}

	using(indexType: IndexType | string) {
		this.#compileArgs.using = indexType;
		return this;
	}

	where(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		lhs: any | Expression<any>,
		op: ComparisonOperatorExpression,
		rhs: unknown,
	): this;
	where(
		factory: (
			qb: ExpressionBuilder<
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				ShallowRecord<string, ShallowRecord<any & string, any>>,
				string
			>,
		) => Expression<SqlBool>,
	): this;
	where(expression: Expression<SqlBool>): this;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	where(...args: any[]) {
		this.#compileArgs.where = args;
		return this;
	}

	compileArgs() {
		return this.#compileArgs;
	}
}
