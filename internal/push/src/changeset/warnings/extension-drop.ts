import type { ChangeWarningType } from "~push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~push/changeset/warnings/codes.js";

export type ExtensionDrop = {
	type: ChangeWarningType.Destructive | `${ChangeWarningType.Destructive}`;
	code: ChangeWarningCode.ExtensionDrop | `${ChangeWarningCode.ExtensionDrop}`;
	extensionName: string;
};
