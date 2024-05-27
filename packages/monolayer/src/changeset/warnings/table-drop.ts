import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type TableDrop = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.TableDrop;
	schema: string;
	table: string;
};
