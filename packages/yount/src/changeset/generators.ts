import { tableMigrationOpGenerator } from "../database/schema/table/changeset.js";
import { columnMigrationOpGenerator } from "../database/schema/table/column/changeset.js";
import { columnDataTypeMigrationOpGenerator } from "../database/schema/table/column/modify-changeset/data-type.js";
import { columnDefaultMigrationOpGenerator } from "../database/schema/table/column/modify-changeset/default.js";
import { columnIdentityMigrationOpGenerator } from "../database/schema/table/column/modify-changeset/identity.js";
import { ColumnNameMigrationOpGenerator } from "../database/schema/table/column/modify-changeset/name.js";
import { columnNullableMigrationOpGenerator } from "../database/schema/table/column/modify-changeset/nullable.js";
import { CheckMigrationOpGenerator } from "../database/schema/table/constraints/check/changeset.js";
import { foreignKeyMigrationOpGenerator } from "../database/schema/table/constraints/foreign-key/changeset.js";
import { primaryKeyMigrationOpGenerator } from "../database/schema/table/constraints/primary-key/changeset.js";
import { uniqueConstraintMigrationOpGenerator } from "../database/schema/table/constraints/unique/changeset.js";
import { indexMigrationOpGenerator } from "../database/schema/table/index/changeset.js";
import { triggerMigrationOpGenerator } from "../database/schema/table/trigger/changeset.js";
import { enumMigrationOpGenerator } from "../database/schema/types/enum/changeset.js";

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
];
