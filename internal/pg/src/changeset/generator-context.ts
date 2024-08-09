import type { CamelCaseOptions } from "~/camel-case-options.js";
import type { TypeAlignment } from "~/changeset/helpers/alignment.js";
import type { SplitColumnRefactoring } from "~/changeset/refactors/split-column.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~/introspection/schema.js";
import type { SchemaMigrationInfo } from "~/schema/column/types.js";

export interface GeneratorContext {
	local: SchemaMigrationInfo;
	db: SchemaMigrationInfo;
	addedTables: string[];
	droppedTables: string[];
	schemaName: string;
	camelCaseOptions: CamelCaseOptions;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
	typeAlignments: TypeAlignment[];
	addedColumns: Record<string, string[]>;
	droppedColumns: Record<string, string[]>;
	splitRefactors: SplitColumnRefactoring[];
}
