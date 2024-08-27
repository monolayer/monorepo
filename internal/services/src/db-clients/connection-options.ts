import { appEnvironment } from "@monorepo/state/app-environment.js";
import { gen } from "effect/Effect";
import pgConnectionString from "pg-connection-string";

export const connectionOptions = gen(function* () {
	const connectionString = (yield* appEnvironment).currentDatabase
		.connectionString;
	const parsed = pgConnectionString.parse(connectionString);
	return {
		app: connectionString,
		admin: connectionString.replace(
			`${parsed.port}/${parsed.database}`,
			`${parsed.port}`,
		),
		databaseName: parsed.database ?? "",
	};
});
