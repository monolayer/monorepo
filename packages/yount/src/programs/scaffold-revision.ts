import { Effect } from "effect";
import nunjucks from "nunjucks";
import path from "path";
import { createFile } from "~/utils.js";
import { Environment } from "../services/environment.js";
import { revisionName } from "./revision-name.js";

export function scaffoldRevision() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		const name = yield* _(revisionName());
		const timestamp = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.split(".")[0];
		const filePath = path.join(
			environment.schemaRevisionsFolder,
			`${timestamp}-${name}.ts`,
		);

		const content = nunjucks.compile(revisionTemplate).render();
		createFile(filePath, content, true);
		return yield* _(Effect.succeed(filePath));
	});
}

const revisionTemplate = `import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
