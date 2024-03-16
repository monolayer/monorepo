import { CheckMigrationOpGenerator } from "./check.js";
import { columnMigrationOpGenerator } from "./column.js";
import { columnDataTypeMigrationOpGenerator } from "./column_change/data_type.js";
import { columnDefaultMigrationOpGenerator } from "./column_change/default.js";
import { columnIdentityMigrationOpGenerator } from "./column_change/identity.js";
import { ColumnNameMigrationOpGenerator } from "./column_change/name.js";
import { columnNullableMigrationOpGenerator } from "./column_change/nullable.js";
import { enumMigrationOpGenerator } from "./enums.js";
import { extensionMigrationOpGenerator } from "./extensions.js";
import { foreignKeyMigrationOpGenerator } from "./foreign_key.js";
import { indexMigrationOpGenerator } from "./index.js";
import { primaryKeyMigrationOpGenerator } from "./primary_key.js";
import { tableMigrationOpGenerator } from "./table.js";
import { triggerMigrationOpGenerator } from "./trigger.js";
import { uniqueConstraintMigrationOpGenerator } from "./unique.js";

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
