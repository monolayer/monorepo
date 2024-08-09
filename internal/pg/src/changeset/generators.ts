import { CheckMigrationOpGenerator } from "~/changeset/generators/check.js";
import { columnMigrationOpGenerator } from "~/changeset/generators/column.js";
import { enumMigrationOpGenerator } from "~/changeset/generators/enum.js";
import { foreignKeyMigrationOpGenerator } from "~/changeset/generators/foreign-key.js";
import { indexMigrationOpGenerator } from "~/changeset/generators/index.js";
import { columnDataTypeMigrationOpGenerator } from "~/changeset/generators/modify-column-data-type.js";
import { columnDefaultMigrationOpGenerator } from "~/changeset/generators/modify-column-default.js";
import { columnIdentityMigrationOpGenerator } from "~/changeset/generators/modify-column-identity.js";
import { ColumnNameMigrationOpGenerator } from "~/changeset/generators/modify-column-name.js";
import { columnNullableMigrationOpGenerator } from "~/changeset/generators/modify-column-nullable.js";
import { primaryKeyMigrationOpGenerator } from "~/changeset/generators/primary-key.js";
import { schemaMigrationOpGenerator } from "~/changeset/generators/schema.js";
import { tableMigrationOpGenerator } from "~/changeset/generators/table.js";
import { triggerMigrationOpGenerator } from "~/changeset/generators/trigger.js";
import { uniqueConstraintMigrationOpGenerator } from "~/changeset/generators/unique.js";

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
