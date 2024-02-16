import { columnMigrationOpGenerator } from "./migration_op/column.js";
import { columnDataTypeMigrationOpGenerator } from "./migration_op/column_change/data_type.js";
import { columnDefaultMigrationOpGenerator } from "./migration_op/column_change/default.js";
import { columnForeignKeyMigrationOpGenerator } from "./migration_op/column_change/foreign_key.js";
import { columnIdentityMigrationOpGenerator } from "./migration_op/column_change/identity.js";
import { columnNullableMigrationOpGenerator } from "./migration_op/column_change/nullable.js";
import { columnPrimaryKeyMigrationOpGenerator } from "./migration_op/column_change/primary_key.js";
import { uniqueMigrationOpGenerator } from "./migration_op/column_change/unique.js";
import { enumMigrationOpGenerator } from "./migration_op/enums.js";
import { extensionMigrationOpGenerator } from "./migration_op/extensions.js";
import { foreignKeyMigrationOpGenerator } from "./migration_op/foreign_key.js";
import { indexMigrationOpGenerator } from "./migration_op/index.js";
import { primaryKeyMigrationOpGenerator } from "./migration_op/primary_key.js";
import { tableMigrationOpGenerator } from "./migration_op/table.js";
import { triggerMigrationOpGenerator } from "./migration_op/trigger.js";
import { uniqueConstraintMigrationOpGenerator } from "./migration_op/unique.js";

export const migrationOpGenerators = [
	extensionMigrationOpGenerator,
	tableMigrationOpGenerator,
	columnMigrationOpGenerator,
	columnDataTypeMigrationOpGenerator,
	columnDefaultMigrationOpGenerator,
	columnNullableMigrationOpGenerator,
	columnPrimaryKeyMigrationOpGenerator,
	columnForeignKeyMigrationOpGenerator,
	columnIdentityMigrationOpGenerator,
	indexMigrationOpGenerator,
	uniqueMigrationOpGenerator,
	primaryKeyMigrationOpGenerator,
	uniqueConstraintMigrationOpGenerator,
	foreignKeyMigrationOpGenerator,
	triggerMigrationOpGenerator,
	enumMigrationOpGenerator,
];
