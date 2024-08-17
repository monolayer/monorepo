import type { TypeAlignment } from "~pg/changeset/helpers/alignment.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~pg/introspection/schema.js";
import type { SchemaMigrationInfo } from "~pg/schema/column/types.js";

export interface GeneratorContext {
	local: SchemaMigrationInfo;
	db: SchemaMigrationInfo;
	addedTables: string[];
	droppedTables: string[];
	schemaName: string;
	camelCase: boolean;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
	typeAlignments: TypeAlignment[];
	addedColumns: Record<string, string[]>;
	droppedColumns: Record<string, string[]>;
}
