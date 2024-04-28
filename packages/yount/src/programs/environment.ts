import { Effect } from "effect";
import { Environment } from "~/services/environment.js";

export function schemaRevisionsFolder() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		return environment.schemaRevisionsFolder;
	});
}
