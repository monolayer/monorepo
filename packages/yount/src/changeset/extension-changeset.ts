import microdiff from "microdiff";
import { extensionMigrationOpGenerator } from "~/schema/extension/changeset.js";
import type { ExtensionInfo } from "~/schema/extension/introspection.js";

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
