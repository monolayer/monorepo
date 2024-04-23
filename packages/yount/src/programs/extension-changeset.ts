import { Effect } from "effect";
import { extensionChangeset } from "~/changeset/extension-changeset.js";
import {
	dbExtensionInfo,
	localExtensionInfo,
} from "~/database/extension/introspection.js";
import { DbClients } from "~/services/dbClients.js";
import { DevEnvironment } from "~/services/environment.js";

export function computeExtensionChangeset() {
	return Effect.all([
		configurationExtensions().pipe(
			Effect.flatMap((extensions) =>
				Effect.succeed(localExtensionInfo(extensions)),
			),
		),
		DbClients.pipe(
			Effect.flatMap((dbClients) =>
				Effect.tryPromise(() =>
					dbExtensionInfo(dbClients.developmentEnvironment.kyselyNoCamelCase),
				),
			),
		),
	]).pipe(
		Effect.flatMap(([local, remote]) =>
			Effect.succeed(extensionChangeset(local, remote)),
		),
	);
}

function configurationExtensions() {
	return DevEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(environment.configuration.extensions),
		),
	);
}
