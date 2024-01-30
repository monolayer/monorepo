import * as p from "@clack/prompts";
import { exit } from "process";
import { Config, importSchema } from "~/config.js";
import {
	schemaDBColumnInfoByTable,
	schemaDBIndexInfoByTable,
} from "~/database/change_set/schema_info.js";

export async function analyzeLocalSchema(config: Config) {
	const s = p.spinner();
	s.start(`Analyzing database schema at ${config.folder}/schema.ts.`);
	const schema = await importSchema();
	if (schema.database === undefined) {
		s.stop(`Analyzed ${config.folder}/schema.ts import.`);
		p.log.warning(
			`Nothing to do. No database schema exported at ${config.folder}/schema.ts.`,
		);
		p.outro("Done");
		exit(0);
	}
	const localTableColumnInfo = schemaDBColumnInfoByTable(schema.database);
	const localIndexInfo = schemaDBIndexInfoByTable(schema.database);
	s.stop("Analyzed schema at app/db/schema.ts");
	return {
		columns: localTableColumnInfo,
		indexes: localIndexInfo,
	};
}
