import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type ColumnDrop = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.ColumnDrop;
	schema: string;
	table: string;
	column: string;
};
