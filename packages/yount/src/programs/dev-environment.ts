import { Effect } from "effect";
import { DevEnvironment } from "~/services/environment.js";

export function camelCaseOptions() {
	return DevEnvironment.pipe(
		Effect.flatMap((devEnvironment) =>
			Effect.succeed(devEnvironment.camelCasePlugin),
		),
	);
}
