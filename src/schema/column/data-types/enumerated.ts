import { PgEnum } from "../column.js";

export function enumerated<Value extends string>(enumerated: EnumType<Value>) {
	return new PgEnum(enumerated.name, enumerated.values);
}

export function enumType<V extends string>(name: string, values: V[]) {
	return new EnumType(name, values);
}

export class EnumType<Value extends string> {
	/**
	 * @hidden
	 */
	protected isExternal: boolean;
	/**
	 * @hidden
	 */
	constructor(
		public name: string,
		public values: Value[],
	) {
		this.isExternal = false;
	}

	external() {
		this.isExternal = true;
		return this;
	}
}
