import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type ColumnDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.ColumnDrop | `${ChangeWarningCode.ColumnDrop}`;
	schema: string;
	table: string;
	column: string;
};
