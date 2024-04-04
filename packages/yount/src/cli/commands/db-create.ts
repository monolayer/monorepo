import { createDatabase } from "../programs/create-database.js";
import { cliAction } from "../utils/cli-action.js";

export async function dbCreate(environment: string) {
	await cliAction("yount db:create", environment, [createDatabase()]);
}
