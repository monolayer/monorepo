import { pathExists } from "@monorepo/utils/path.js";
import { gen } from "effect/Effect";
import path from "node:path";
import { databaseDestinationFolder } from "./destination-folder.js";

export const checkMigrationExists = (name: string) =>
	gen(function* () {
		const folder = yield* databaseDestinationFolder;
		return yield* pathExists(path.join(folder, `${name}.ts`));
	});
