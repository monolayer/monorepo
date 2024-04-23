import { Effect } from "effect";
import { DevEnvironment } from "~/services/environment.js";

export function configurationSchemas() {
	return Effect.gen(function* (_) {
		const environment = yield* _(DevEnvironment);
		return environment.configuration.schemas;
	});
}
