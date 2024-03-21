import { EnumType } from "~/schema/types/enum/enum.js";
import { StringColumn } from "../column.js";

export function enumerated<Value extends string>(enumerated: EnumType<Value>) {
	return new PgEnum(enumerated.name, enumerated.values);
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
