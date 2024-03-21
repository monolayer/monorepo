import { StringColumn } from "../column.js";

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

export class PgEnum<Value extends string> extends StringColumn<Value, Value> {
	/**
	 * @hidden
	 */
	protected readonly values: Value[];
	/**
	 * @hidden
	 */
	constructor(name: string, values: Value[]) {
		super(name);
		this.info.enum = true;
		this.values = values;
	}
}
