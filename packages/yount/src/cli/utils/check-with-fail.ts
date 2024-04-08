import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { DevEnvironment, Environment } from "../services/environment.js";
import type { Db } from "../services/kysely.js";
import type { Migrator } from "../services/migrator.js";
import type { DevPg, Pg } from "../services/pg.js";
import { check } from "../utils/spinner-task.js";

export function checkWithFail({
	name,
	nextSteps,
	errorMessage,
	failMessage,
	callback,
}: {
	name: string;
	nextSteps: string;
	errorMessage: string;
	failMessage: string;
	callback: () => Effect.Effect<
		boolean,
		unknown,
		Environment | DevEnvironment | Db | Migrator | Pg | DevPg
	>;
}) {
	return check(name, () =>
		Effect.succeed(true).pipe(Effect.flatMap(callback)),
	).pipe(
		Effect.flatMap((result) =>
			Effect.if(result, {
				onTrue: Effect.succeed(true),
				onFalse: Effect.succeed(true).pipe(
					Effect.flatMap(() => {
						p.log.error(errorMessage);
						p.note(nextSteps, "Next Steps");
						return Effect.fail(failMessage);
					}),
				),
			}),
		),
	);
}
