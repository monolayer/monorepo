import { Effect } from "effect";
import {
	DbClients,
	type DbClientEnvironmentProperties,
} from "~/services/dbClients.js";

export function devEnvirinmentDbClient<
	T extends keyof DbClientEnvironmentProperties,
>(key: T) {
	return DbClients.pipe(
		Effect.flatMap((dbClients) =>
			Effect.succeed(dbClients.developmentEnvironment[key]),
		),
	);
}
