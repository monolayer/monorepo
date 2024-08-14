import type { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";

export type TableDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.TableDrop | `${ChangeWarningCode.TableDrop}`;
	schema: string;
	table: string;
};
