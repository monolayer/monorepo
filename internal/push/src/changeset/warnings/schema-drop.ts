import type { ChangeWarningType } from "~push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~push/changeset/warnings/codes.js";

export type SchemaDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.SchemaDrop | `${ChangeWarningCode.SchemaDrop}`;
	schema: string;
};
