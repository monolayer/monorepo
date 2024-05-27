import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type SchemaDrop = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.SchemaDrop;
	schema: string;
};
