import { dropDatabase } from "../programs/drop-database.js";
import { cliAction } from "../utils/cli-action.js";

export async function dbDrop(environment: string) {
	await cliAction("yount db:drop", environment, [dropDatabase()]);
}
