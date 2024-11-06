import { logGray } from "@monorepo/cli/console.js";
import { gen } from "effect/Effect";
import path from "node:path";
import { cwd } from "node:process";
import { databaseDestinationFolder } from "./destination-folder.js";

export const dataInfo = gen(function* () {
	const folder = yield* databaseDestinationFolder("data");
	logGray(`Data folder: ./${path.relative(cwd(), folder)}`);
});
