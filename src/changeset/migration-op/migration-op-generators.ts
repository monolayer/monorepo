import { CheckMigrationOpGenerator } from "./check.js";
import { columnDataTypeMigrationOpGenerator } from "./column-change/data-type.js";
import { columnDefaultMigrationOpGenerator } from "./column-change/default.js";
import { columnIdentityMigrationOpGenerator } from "./column-change/identity.js";
import { ColumnNameMigrationOpGenerator } from "./column-change/name.js";
import { columnNullableMigrationOpGenerator } from "./column-change/nullable.js";
import { columnMigrationOpGenerator } from "./column.js";
import { enumMigrationOpGenerator } from "./enums.js";
import { extensionMigrationOpGenerator } from "./extensions.js";
import { foreignKeyMigrationOpGenerator } from "./foreign-key.js";
import { indexMigrationOpGenerator } from "./index.js";
import { primaryKeyMigrationOpGenerator } from "./primary-key.js";
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
