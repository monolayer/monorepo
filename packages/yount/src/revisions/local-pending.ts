import { Effect } from "effect";
import type { MigrationInfo } from "kysely";
import path from "path";
import { schemaRevisionsFolder } from "../programs/environment.js";
import { allRevisions } from "./all.js";

export function localPendingSchemaRevisions() {
	return Effect.gen(function* (_) {
		const folder = yield* _(schemaRevisionsFolder());

		return (yield* _(allRevisions()))
			.filter(byNotExecuted)
			.map((m) => revisionNameAndPath(m, folder));
	});
}

function byNotExecuted(info: MigrationInfo) {
	return info.executedAt === undefined;
}

function revisionNameAndPath(info: MigrationInfo, folder: string) {
	return {
		name: info.name,
		path: path.join(folder, `${info.name}.ts`),
	};
}
