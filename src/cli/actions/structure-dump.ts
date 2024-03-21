import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { importConfig } from "../../config.js";
import { dumpStructure } from "../components/dump-structure.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function structureDump(environment: string) {
	p.intro("Structure Dump");
	const s = p.spinner();
	s.start("Dumping database structure");
	const config = await importConfig();
	checkEnvironmentIsConfigured(config, environment, {
		spinner: s,
		outro: true,
	});

	const result = await dumpStructure(config, environment);
	if (result instanceof Error) {
		s.stop(result.message, 1);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}
	s.stop(`${color.green("dumped")} ${result}`);
	p.outro("Done");
}
