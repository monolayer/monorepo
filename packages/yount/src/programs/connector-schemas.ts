import { Effect } from "effect";
import { DevEnvironment } from "~/services/environment.js";

export function connectorSchemas() {
	return Effect.gen(function* (_) {
		const environment = yield* _(DevEnvironment);
		return environment.connector.schemas;
	});
}
