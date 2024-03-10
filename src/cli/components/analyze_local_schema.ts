import * as p from "@clack/prompts";
import { exit } from "process";
import { Config, importSchema, type CamelCaseOptions } from "~/config.js";
import { localSchema } from "~/database/introspection/schemas.js";
import type { MigrationSchema } from "~/database/migrations/migration_schema.js";

export async function analyzeLocalSchema(
	config: Config,
	remoteSchema: MigrationSchema,
	camelCase: CamelCaseOptions,
) {
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
	const local = localSchema(schema.database, remoteSchema, camelCase);
	s.stop("Analyzed schema at app/db/schema.ts");
	return local;
}
