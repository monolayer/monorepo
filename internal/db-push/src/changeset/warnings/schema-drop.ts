import type { ChangeWarningType } from "~db-push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~db-push/changeset/warnings/codes.js";

export type SchemaDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.SchemaDrop | `${ChangeWarningCode.SchemaDrop}`;
	schema: string;
};
