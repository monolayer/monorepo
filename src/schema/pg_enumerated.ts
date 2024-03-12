import { pgEnum } from "./pg_column.js";

export function enumType(name: string, values: string[]) {
	return new EnumType(name, values);
}

export class EnumType {
	/**
	 * @hidden
	 */
	constructor(
		public name: string,
		public values: string[],
	) {}
}

export function enumerated(enumerated: EnumType) {
	return pgEnum(enumerated.name, enumerated.values);
}
