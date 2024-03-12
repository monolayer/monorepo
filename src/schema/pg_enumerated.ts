import { pgEnum } from "./pg_column.js";

export function enumType<V extends string>(name: string, values: V[]) {
	return new EnumType(name, values);
}

export class EnumType<V extends string> {
	/**
	 * @hidden
	 */
	constructor(
		public name: string,
		public values: V[],
	) {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enumerated<E extends string>(enumerated: EnumType<E>) {
	return pgEnum(enumerated.name, enumerated.values);
}
