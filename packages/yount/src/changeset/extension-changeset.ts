import microdiff from "microdiff";
import { extensionMigrationOpGenerator } from "~/database/extension/changeset.js";
import type { ExtensionInfo } from "~/database/extension/introspection.js";

export function extensionChangeset(
	local: ExtensionInfo,
	remote: ExtensionInfo,
) {
	const diff = microdiff({ extensions: remote }, { extensions: local });
	const changeset = diff.flatMap((difference) => {
		const cset = extensionMigrationOpGenerator(difference);
		if (cset !== undefined) return cset;
		return [];
	});
	return changeset;
}
