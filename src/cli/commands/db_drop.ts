import color from "picocolors";
import { exit } from "process";
import { importConfig } from "../../config.js";
import { DbAdmin } from "../../db_admin.js";
import { log } from "../utils/clack.js";

export async function dbDrop() {
	const config = await importConfig();
	const dbAdmin = new DbAdmin(config);
	const result = await dbAdmin.dropDb();
	if (result.error instanceof Error) {
		log.lineMessage(`${color.red("error")} ${result.error.message}`);
		exit(1);
	}
	log.lineMessage(`${color.green("dropped")} ${dbAdmin.databaseName}`);
}
