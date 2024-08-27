import type { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";

export type TriggerDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.TriggerDrop | `${ChangeWarningCode.TriggerDrop}`;
	schema: string;
	table: string;
};
