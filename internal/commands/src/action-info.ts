import { logGray } from "@monorepo/cli/console.js";
import { parseConnectionString } from "@monorepo/services/db-clients/connection-options.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { gen } from "effect/Effect";

export const actionInfo = gen(function* () {
	const env = yield* appEnvironment;
	const parsed = yield* parseConnectionString(
		env.currentDatabase.connectionString,
	);
	logGray(`Loaded databases from: ${env.databases}`);
	logGray(`Database: "${parsed.database}" at "${parsed.host}:${parsed.port}"`);
});
