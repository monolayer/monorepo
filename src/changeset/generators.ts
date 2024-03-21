import { CheckMigrationOpGenerator } from "../schema/check/changeset.js";
import { columnMigrationOpGenerator } from "../schema/column/changeset.js";
import { columnDataTypeMigrationOpGenerator } from "../schema/column/modify-changeset/data-type.js";
import { columnDefaultMigrationOpGenerator } from "../schema/column/modify-changeset/default.js";
import { columnIdentityMigrationOpGenerator } from "../schema/column/modify-changeset/identity.js";
import { ColumnNameMigrationOpGenerator } from "../schema/column/modify-changeset/name.js";
import { columnNullableMigrationOpGenerator } from "../schema/column/modify-changeset/nullable.js";
import { enumMigrationOpGenerator } from "../schema/enum/changeset.js";
import { extensionMigrationOpGenerator } from "../schema/extension/changeset.js";
import { foreignKeyMigrationOpGenerator } from "../schema/foreign-key/changeset.js";
import { indexMigrationOpGenerator } from "../schema/index/changeset.js";
import { primaryKeyMigrationOpGenerator } from "../schema/primary-key/changeset.js";
import { tableMigrationOpGenerator } from "../schema/table/changeset.js";
import { triggerMigrationOpGenerator } from "../schema/trigger/changeset.js";
import { uniqueConstraintMigrationOpGenerator } from "../schema/unique/changeset.js";

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
