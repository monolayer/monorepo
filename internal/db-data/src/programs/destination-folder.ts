import {
	currentDatabaseId,
	currentWorkingDir,
} from "@monorepo/state/app-environment.js";
import { gen } from "effect/Effect";
import path from "node:path";
import { DataCLIState } from "~db-data/state.js";

export const databaseDestinationFolder = (base: string) =>
	gen(function* () {
		return path.join(
			yield* currentWorkingDir,
			(yield* DataCLIState.current).folder ??
				path.join("monolayer", yield* currentDatabaseId, base),
		);
	});
