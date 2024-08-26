import { appEnvironment } from "@monorepo/state/app-environment.js";
import { gen } from "effect/Effect";
import pgConnectionString from "pg-connection-string";

const CONNECTION_STRING_REGEX =
	/^(postgresql:\/\/(?:[^@]*@)?[^/]*)(?:\/[^?]*)(.*)$/;

export const connectionOptions = gen(function* () {
	const connectionString = (yield* appEnvironment).currentDatabase
		.connectionString;
	return {
		app: connectionString,
		admin: connectionString.replace(CONNECTION_STRING_REGEX, "$1$2"),
		databaseName: pgConnectionString.parse(connectionString).database ?? "",
	};
});
