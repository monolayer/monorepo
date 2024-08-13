/**
 * @group Schema Definition
 * @category Data Types
 */
export function enumType<V extends string>(name: string, values: V[]) {
	return new EnumType(name, values);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class EnumType<Value extends string> {
	/**
	 * @hidden
	 */
	protected declare infer: Value;
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
