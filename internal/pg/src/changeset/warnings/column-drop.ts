import type { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";

export type ColumnDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.ColumnDrop | `${ChangeWarningCode.ColumnDrop}`;
	schema: string;
	table: string;
	column: string;
};
