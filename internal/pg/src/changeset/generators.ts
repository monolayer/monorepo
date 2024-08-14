import { CheckMigrationOpGenerator } from "~pg/changeset/generators/check.js";
import { columnMigrationOpGenerator } from "~pg/changeset/generators/column.js";
import { enumMigrationOpGenerator } from "~pg/changeset/generators/enum.js";
import { foreignKeyMigrationOpGenerator } from "~pg/changeset/generators/foreign-key.js";
import { indexMigrationOpGenerator } from "~pg/changeset/generators/index.js";
import { columnDataTypeMigrationOpGenerator } from "~pg/changeset/generators/modify-column-data-type.js";
import { columnDefaultMigrationOpGenerator } from "~pg/changeset/generators/modify-column-default.js";
import { columnIdentityMigrationOpGenerator } from "~pg/changeset/generators/modify-column-identity.js";
import { ColumnNameMigrationOpGenerator } from "~pg/changeset/generators/modify-column-name.js";
import { columnNullableMigrationOpGenerator } from "~pg/changeset/generators/modify-column-nullable.js";
import { primaryKeyMigrationOpGenerator } from "~pg/changeset/generators/primary-key.js";
import { schemaMigrationOpGenerator } from "~pg/changeset/generators/schema.js";
import { tableMigrationOpGenerator } from "~pg/changeset/generators/table.js";
import { triggerMigrationOpGenerator } from "~pg/changeset/generators/trigger.js";
import { uniqueConstraintMigrationOpGenerator } from "~pg/changeset/generators/unique.js";

export const migrationOpGenerators = [
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
	schemaMigrationOpGenerator,
];
