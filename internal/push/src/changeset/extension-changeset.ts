import {
	dbExtensionInfo,
	ExtensionInfo,
	localExtensionInfo,
} from "@monorepo/pg/introspection/extension.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	appEnvironment,
	appEnvironmentDebug,
} from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { all, gen } from "effect/Effect";
import microdiff from "microdiff";
import { codeChangeset } from "~push/changeset/code-changeset.js";
import { createExtensionChangeset } from "~push/changeset/generators/extension-create.js";
import { dropExtensionChangeset } from "~push/changeset/generators/extension-drop.js";
import type { CodeChangeset } from "~push/changeset/types/changeset.js";
import {
	isCreateExtensionDiff,
	isDropExtensionDiff,
} from "~push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";

const remoteExtensions = DbClients.pipe(
	Effect.flatMap((dbClients) =>
		Effect.tryPromise(() => dbExtensionInfo(dbClients.kyselyNoCamelCase)),
	),
);

export const computeExtensionChangeset = all([
	localExtensions(),
	remoteExtensions,
]).pipe(
	Effect.flatMap((info: [ExtensionInfo, ExtensionInfo]) =>
		extensionChangeset(info[0], info[1]),
	),
);

function localExtensions() {
	return appEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(
				localExtensionInfo(environment.currentDatabase.extensions),
			),
		),
	);
}

function extensionChangeset(local: ExtensionInfo, remote: ExtensionInfo) {
	return gen(function* () {
		yield* ChangesetGeneratorState.update({
			debug: yield* appEnvironmentDebug,
		});
		const diffs = microdiff({ extensions: remote }, { extensions: local });
		const generators = [
			codeChangeset({
				validate: isCreateExtensionDiff,
				process: createExtensionChangeset,
			}),
			codeChangeset({
				validate: isDropExtensionDiff,
				process: dropExtensionChangeset,
			}),
		];
		const changesets: CodeChangeset[] = [];
		for (const diff of diffs) {
			for (const generator of generators) {
				const cs = yield* generator(diff);
				if (cs !== undefined) {
					if (Array.isArray(cs)) {
						if (cs.length)
							changesets.push(...cs.filter((c) => c !== undefined));
					} else {
						changesets.push(cs);
					}
				}
			}
		}
		return changesets;
	});
}
