import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type TableDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.TableDrop | `${ChangeWarningCode.TableDrop}`;
	schema: string;
	table: string;
};
