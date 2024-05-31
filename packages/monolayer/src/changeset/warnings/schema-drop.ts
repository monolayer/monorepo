import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type SchemaDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.SchemaDrop | `${ChangeWarningCode.SchemaDrop}`;
	schema: string;
};
