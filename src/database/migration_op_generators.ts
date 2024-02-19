import { columnMigrationOpGenerator } from "./migration_op/column.js";
import { columnDataTypeMigrationOpGenerator } from "./migration_op/column_change/data_type.js";
import { columnDefaultMigrationOpGenerator } from "./migration_op/column_change/default.js";
import { columnIdentityMigrationOpGenerator } from "./migration_op/column_change/identity.js";
import { ColumnNameMigrationOpGenerator } from "./migration_op/column_change/name.js";
import { columnNullableMigrationOpGenerator } from "./migration_op/column_change/nullable.js";
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
	columnIdentityMigrationOpGenerator,
	indexMigrationOpGenerator,
	primaryKeyMigrationOpGenerator,
	uniqueConstraintMigrationOpGenerator,
	foreignKeyMigrationOpGenerator,
	triggerMigrationOpGenerator,
	enumMigrationOpGenerator,
	ColumnNameMigrationOpGenerator,
];
