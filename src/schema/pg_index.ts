import {
	type ComparisonOperatorExpression,
	type Expression,
	type ExpressionBuilder,
	type IndexType,
	type SqlBool,
} from "kysely";
import type { ShallowRecord } from "node_modules/kysely/dist/esm/util/type-utils.js";

type IndexOptions = {
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

export class PgIndex<T extends string | (string & Record<string, never>)> {
	/**
	 * @hidden
	 */
	protected options: IndexOptions;

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected columns: T[],
	) {
		this.options = {
			ifNotExists: false,
			unique: false,
			nullsNotDistinct: false,
			expression: undefined,
			using: undefined,
			where: undefined,
			columns: this.columns,
		};
	}

	ifNotExists() {
		this.options.ifNotExists = true;
		return this;
	}

	unique() {
		this.options.unique = true;
		return this;
	}

	nullsNotDistinct() {
		this.options.nullsNotDistinct = true;
		return this;
	}

	expression(expression: Expression<SqlBool>) {
		this.options.expression = expression;
		return this;
	}

	using(indexType: IndexType | string) {
		this.options.using = indexType;
		return this;
	}

	where(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		lhs: any | Expression<any>,
		op: ComparisonOperatorExpression,
		rhs: unknown,
	): this;
	where(
		factory: (
			qb: ExpressionBuilder<
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				ShallowRecord<string, ShallowRecord<any & string, any>>,
				string
			>,
		) => Expression<SqlBool>,
	): this;
	where(expression: Expression<SqlBool>): this;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	where(...args: unknown[]) {
		this.options.where = args;
		return this;
	}
}

export function index<T extends string | (string & Record<string, never>)>(
	columns: T[],
) {
	return new PgIndex(columns);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function indexOptions<T extends PgIndex<any>>(index: T) {
	assertIndexWithOptions(index);
	return index.options;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertIndexWithOptions<T extends PgIndex<any>>(
	val: T,
): asserts val is T & { options: IndexOptions } {
	true;
}
