import { MaxLengthColumn } from "../column.js";

export function characterVarying(maximumLength?: number) {
	return new PgCharacterVarying("character varying", maximumLength);
}

export function varchar(maximumLength?: number) {
	return characterVarying(maximumLength);
}

export class PgCharacterVarying extends MaxLengthColumn<string, string> {}
