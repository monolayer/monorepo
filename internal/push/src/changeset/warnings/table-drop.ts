import type { ChangeWarningType } from "~push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~push/changeset/warnings/codes.js";

export type TableDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.TableDrop | `${ChangeWarningCode.TableDrop}`;
	schema: string;
	table: string;
};
