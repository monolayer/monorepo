import {
	currentDatabaseId,
	currentWorkingDir,
} from "@monorepo/state/app-environment.js";
import { gen } from "effect/Effect";
import path from "node:path";
import { DataCLIState } from "~data/state.js";

export const databaseDestinationFolder = gen(function* () {
	const currWorkingDir = yield* currentWorkingDir;
	const databaseId = yield* currentDatabaseId;
	const group = (yield* DataCLIState.current).group;
	return path.join(
		currWorkingDir,
		path.join("monolayer", databaseId, "data", group === "data" ? "" : group),
	);
});

export const seedDestinationFolder = gen(function* () {
	const currWorkingDir = yield* currentWorkingDir;
	const databaseId = yield* currentDatabaseId;
	return path.join(currWorkingDir, path.join("monolayer", databaseId));
});
