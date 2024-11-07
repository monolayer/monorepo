import type { ChangeWarningType } from "~push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~push/changeset/warnings/codes.js";

export type ColumnDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.ColumnDrop | `${ChangeWarningCode.ColumnDrop}`;
	schema: string;
	table: string;
	column: string;
};
