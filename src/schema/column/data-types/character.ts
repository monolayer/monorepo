import { MaxLengthColumn } from "../column.js";

export function character(maximumLength?: number) {
	return new PgCharacter("character", maximumLength ? maximumLength : 1);
}

export function char(maximumLength?: number) {
	return character(maximumLength);
}

export class PgCharacter extends MaxLengthColumn<string, string> {}
