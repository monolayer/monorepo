import { extensionChangeset } from "@monorepo/pg/changeset/generators/extension.js";
import {
	dbExtensionInfo,
	ExtensionInfo,
	localExtensionInfo,
} from "@monorepo/pg/introspection/extension.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { all } from "effect/Effect";

export const remoteExtensions = DbClients.pipe(
	Effect.flatMap((dbClients) =>
		Effect.tryPromise(() => dbExtensionInfo(dbClients.kyselyNoCamelCase)),
	),
);

export const computeExtensionChangeset = all([
	localExtensions(),
	remoteExtensions,
]).pipe(
	Effect.flatMap((info: [ExtensionInfo, ExtensionInfo]) =>
		Effect.succeed(extensionChangeset(info[0], info[1])),
	),
);

function localExtensions() {
	return appEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(localExtensionInfo(environment.database.extensions)),
		),
	);
}
