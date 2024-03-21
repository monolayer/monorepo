import { extensionMigrationOpGenerator } from "../schema/extension/changeset.js";
import { tableMigrationOpGenerator } from "../schema/table/changeset.js";
import { columnMigrationOpGenerator } from "../schema/table/column/changeset.js";
import { columnDataTypeMigrationOpGenerator } from "../schema/table/column/modify-changeset/data-type.js";
import { columnDefaultMigrationOpGenerator } from "../schema/table/column/modify-changeset/default.js";
import { columnIdentityMigrationOpGenerator } from "../schema/table/column/modify-changeset/identity.js";
import { ColumnNameMigrationOpGenerator } from "../schema/table/column/modify-changeset/name.js";
import { columnNullableMigrationOpGenerator } from "../schema/table/column/modify-changeset/nullable.js";
import { CheckMigrationOpGenerator } from "../schema/table/constraints/check/changeset.js";
import { foreignKeyMigrationOpGenerator } from "../schema/table/constraints/foreign-key/changeset.js";
import { primaryKeyMigrationOpGenerator } from "../schema/table/constraints/primary-key/changeset.js";
import { uniqueConstraintMigrationOpGenerator } from "../schema/table/constraints/unique/changeset.js";
import { indexMigrationOpGenerator } from "../schema/table/index/changeset.js";
import { triggerMigrationOpGenerator } from "../schema/table/trigger/changeset.js";
import { enumMigrationOpGenerator } from "../schema/types/enum/changeset.js";

export const migrationOpGenerators = [
	extensionMigrationOpGenerator,
	tableMigrationOpGenerator,
	columnMigrationOpGenerator,
	columnDataTypeMigrationOpGenerator,
	columnDefaultMigrationOpGenerator,
	columnNullableMigrationOpGenerator,
	columnIdentityMigrationOpGenerator,
	indexMigrationOpGenerator,
	primaryKeyMigrationOpGenerator,
	uniqueConstraintMigrationOpGenerator,
	foreignKeyMigrationOpGenerator,
	triggerMigrationOpGenerator,
	enumMigrationOpGenerator,
	ColumnNameMigrationOpGenerator,
	CheckMigrationOpGenerator,
];
