import type { AnySchema } from "@monorepo/pg/schema/schema.js";
import { assert } from "vitest";
import { ChangesetPhase } from "~db-push/changeset/types/changeset.js";
import type { Renames } from "~db-push/state/rename.js";
import { pushSchema } from "../helpers/push-schema.js";
import type { TestContext } from "../setup.js";

export async function assertSuccessfulPush(
	context: TestContext,
	schema: AnySchema,
	renames?: Renames,
) {
	context.queryLog = [];
	let success = false;
	try {
		success = await pushSchema({
			context,
			configuration: {
				id: "default",
				schemas: [schema],
				camelCase: context.camelCase ?? false,
			},
			renames,
			phases: [
				ChangesetPhase.Expand,
				ChangesetPhase.Alter,
				ChangesetPhase.Contract,
			],
			mock: () => {},
		});
	} catch {
		//
	}

	assert(success, `Push was unsuccessful. Check logs for details`);

	return context.queryLog.filter(
		(log) =>
			!log.includes("monolayer_transforms") &&
			log !== "begin" &&
			log !== "commit" &&
			!log.includes("pg_advisor") &&
			!log.includes("create extension if not exists plv8") &&
			!log.includes("FOR old_index_name IN"),
	);
}
