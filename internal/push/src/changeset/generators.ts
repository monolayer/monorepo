/* eslint-disable max-lines */
import { codeChangeset } from "./code-changeset.js";
import {
	createCheckChangeset,
	createMultipleCheckChangeset,
} from "./generators/check-create.js";
import {
	dropAllChecksChangeset,
	dropCheckChangeset,
} from "./generators/check-drop.js";
import { renameCheckChangeset } from "./generators/check-rename.js";
import { changeColumDataTypeChangeset } from "./generators/column-change-data-type.js";
import {
	addDefaultToColumnChangeset,
	changeDefaultFromColumnChangeset,
	dropDefaultFromColumnChangeset,
} from "./generators/column-change-default.js";
import {
	addColumnIdentityChangeset,
	dropColumnIdentityChangeset,
} from "./generators/column-change-identity.js";
import { columnNullableChangeset } from "./generators/column-change-nullable.js";
import {
	columnCreateChangeset,
	columnCreateNonNullableChangeset,
} from "./generators/column-create.js";
import { columnDropChangeset } from "./generators/column-drop.js";
import { renameColumnChangeset } from "./generators/column-rename.js";
import { changeEnumChangeset } from "./generators/enum-change.js";
import { createEnumChangeset } from "./generators/enum-create.js";
import { dropEnumChangeset } from "./generators/enum-drop.js";
import {
	createForeignKeyChangeset,
	createMultipleForeignKeyChangeset,
} from "./generators/foreign-key-create.js";
import {
	dropForeignKeyChangeset,
	dropMultipleForeignKeyChangeset,
} from "./generators/foreign-key-drop.js";
import { renameForeignKeyChangeset } from "./generators/foreign-key-rename.js";
import {
	createIndexChangeset,
	createMultipleIndexesChangeset,
} from "./generators/index-create.js";
import {
	dropIndexChangeset,
	dropMultipleIndexesChangeset,
} from "./generators/index-drop.js";
import { renameIndexChangeset } from "./generators/index-rename.js";
import { changePrimaryKeyChangeset } from "./generators/primary-key-change.js";
import { createPrimaryKeyChangeset } from "./generators/primary-key-create.js";
import { dropPrimaryKeyChangeset } from "./generators/primary-key-drop.js";
import { createTableChangeset } from "./generators/table-create.js";
import { dropTableChangeset } from "./generators/table-drop.js";
import { renameTableChangeset } from "./generators/table-rename.js";
import { renameTriggerChangeset } from "./generators/trigger-change.js";
import {
	createMultipleTriggersChangeset,
	createTriggerChangeset,
} from "./generators/trigger-create.js";
import {
	dropMultipleTriggersChangeset,
	dropTriggerChangeset,
} from "./generators/trigger-drop.js";
import {
	createMultipleUniqueConstraintsChangeset,
	createUniqueConstraintChangeset,
} from "./generators/unique-create.js";
import {
	dropMultipleUniqueConstraintChangeset,
	dropUniqueConstraintChangeset,
} from "./generators/unique-drop.js";
import { renameUniqueConstraintChangeset } from "./generators/unique-rename.js";
import {
	isAddColumnDefaultDiff,
	isAddColumnIdentityDiff,
	isChangeColumnDefaultDiff,
	isChangeEnumDiff,
	isChangeTriggerDiff,
	isColumnDataTypeDiff,
	isColumnDropDefaultDiff,
	isColumnDropDiff,
	isColumnNullableDiff,
	isCreateCheckDiff,
	isCreateColumnDiff,
	isCreateEnumDiff,
	isCreateForeignKeyDiff,
	isCreateIndexDiff,
	isCreateMultipleCheckDiff,
	isCreateMultipleForeignKeyDiff,
	isCreateMultipleIndexesDiff,
	isCreateMultipleTriggerDiff,
	isCreateMultipleUniqueDiff,
	isCreateNonNullableColumnDiff,
	isCreateTableDiff,
	isCreateTriggerDiff,
	isCreateUniqueDiff,
	isDropCheckDiff,
	isDropColumnIdentityDiff,
	isDropEnumDiff,
	isDropForeignKeyDiff,
	isDropIndexDiff,
	isDropMultipleChecksDiff,
	isDropMultipleForeignKeyDiff,
	isDropMultipleIndexesDiff,
	isDropMultipleTriggerDiff,
	isDropMultipleUniqueDiff,
	isDropTableDiff,
	isDropTriggerDiff,
	isDropUniqueDiff,
	isPrimaryKeyChangeDiff,
	isPrimaryKeyCreateDiff,
	isPrimaryKeyDropDiff,
	isRenameCheckDiff,
	isRenameColumnDiff,
	isRenameForeignKeyDiff,
	isRenameIndexDiff,
	isRenameTableDiff,
	isRenameUniqueDiff,
} from "./types/diff.js";

const tables = [
	codeChangeset({
		validate: isCreateTableDiff,
		process: createTableChangeset,
	}),
	codeChangeset({
		validate: isDropTableDiff,
		process: dropTableChangeset,
	}),
	codeChangeset({
		validate: isRenameTableDiff,
		process: renameTableChangeset,
	}),
];

const enums = [
	codeChangeset({
		validate: isCreateEnumDiff,
		process: createEnumChangeset,
	}),
	codeChangeset({
		validate: isDropEnumDiff,
		process: dropEnumChangeset,
	}),
	codeChangeset({
		validate: isChangeEnumDiff,
		process: changeEnumChangeset,
	}),
];

const checks = [
	codeChangeset({
		validate: isCreateCheckDiff,
		process: createCheckChangeset,
	}),
	codeChangeset({
		validate: isCreateMultipleCheckDiff,
		process: createMultipleCheckChangeset,
	}),
	codeChangeset({
		validate: isDropCheckDiff,
		process: dropCheckChangeset,
	}),
	codeChangeset({
		validate: isDropMultipleChecksDiff,
		process: dropAllChecksChangeset,
	}),
	codeChangeset({
		validate: isRenameCheckDiff,
		process: renameCheckChangeset,
	}),
];

const column = [
	codeChangeset({
		validate: isColumnNullableDiff,
		process: columnNullableChangeset,
	}),
	codeChangeset({
		validate: isColumnDropDiff,
		process: columnDropChangeset,
	}),
	codeChangeset({
		validate: isCreateColumnDiff,
		process: columnCreateChangeset,
	}),
	codeChangeset({
		validate: isRenameColumnDiff,
		process: renameColumnChangeset,
	}),
	codeChangeset({
		validate: isCreateNonNullableColumnDiff,
		process: columnCreateNonNullableChangeset,
	}),
	codeChangeset({
		validate: isAddColumnIdentityDiff,
		process: addColumnIdentityChangeset,
	}),
	codeChangeset({
		validate: isDropColumnIdentityDiff,
		process: dropColumnIdentityChangeset,
	}),
	codeChangeset({
		validate: isAddColumnDefaultDiff,
		process: addDefaultToColumnChangeset,
	}),
	codeChangeset({
		validate: isChangeColumnDefaultDiff,
		process: changeDefaultFromColumnChangeset,
	}),
	codeChangeset({
		validate: isColumnDropDefaultDiff,
		process: dropDefaultFromColumnChangeset,
	}),
	codeChangeset({
		validate: isColumnDataTypeDiff,
		process: changeColumDataTypeChangeset,
	}),
];

const unique = [
	codeChangeset({
		validate: isCreateUniqueDiff,
		process: createUniqueConstraintChangeset,
	}),
	codeChangeset({
		validate: isCreateMultipleUniqueDiff,
		process: createMultipleUniqueConstraintsChangeset,
	}),
	codeChangeset({
		validate: isDropUniqueDiff,
		process: dropUniqueConstraintChangeset,
	}),
	codeChangeset({
		validate: isDropMultipleUniqueDiff,
		process: dropMultipleUniqueConstraintChangeset,
	}),
	codeChangeset({
		validate: isRenameUniqueDiff,
		process: renameUniqueConstraintChangeset,
	}),
];

const primaryKey = [
	codeChangeset({
		validate: isPrimaryKeyCreateDiff,
		process: createPrimaryKeyChangeset,
	}),
	codeChangeset({
		validate: isPrimaryKeyDropDiff,
		process: dropPrimaryKeyChangeset,
	}),
	codeChangeset({
		validate: isPrimaryKeyChangeDiff,
		process: changePrimaryKeyChangeset,
	}),
];

const index = [
	codeChangeset({
		validate: isCreateIndexDiff,
		process: createIndexChangeset,
	}),
	codeChangeset({
		validate: isCreateMultipleIndexesDiff,
		process: createMultipleIndexesChangeset,
	}),
	codeChangeset({
		validate: isDropIndexDiff,
		process: dropIndexChangeset,
	}),
	codeChangeset({
		validate: isDropMultipleIndexesDiff,
		process: dropMultipleIndexesChangeset,
	}),
	codeChangeset({
		validate: isRenameIndexDiff,
		process: renameIndexChangeset,
	}),
];

const foreignKey = [
	codeChangeset({
		validate: isCreateForeignKeyDiff,
		process: createForeignKeyChangeset,
	}),
	codeChangeset({
		validate: isCreateMultipleForeignKeyDiff,
		process: createMultipleForeignKeyChangeset,
	}),
	codeChangeset({
		validate: isDropForeignKeyDiff,
		process: dropForeignKeyChangeset,
	}),
	codeChangeset({
		validate: isDropMultipleForeignKeyDiff,
		process: dropMultipleForeignKeyChangeset,
	}),
	codeChangeset({
		validate: isRenameForeignKeyDiff,
		process: renameForeignKeyChangeset,
	}),
];

const trigger = [
	codeChangeset({
		validate: isCreateTriggerDiff,
		process: createTriggerChangeset,
	}),
	codeChangeset({
		validate: isCreateMultipleTriggerDiff,
		process: createMultipleTriggersChangeset,
	}),
	codeChangeset({
		validate: isDropTriggerDiff,
		process: dropTriggerChangeset,
	}),
	codeChangeset({
		validate: isDropMultipleTriggerDiff,
		process: dropMultipleTriggersChangeset,
	}),
	codeChangeset({
		validate: isChangeTriggerDiff,
		process: renameTriggerChangeset,
	}),
];

export const generators = [
	...tables,
	...column,
	...primaryKey,
	...index,
	...unique,
	...foreignKey,
	...enums,
	...checks,
	...trigger,
];
