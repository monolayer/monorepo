import type { Command } from "@commander-js/extra-typings";
import { dataApply } from "./data/apply.js";
import { dataDown } from "./data/down.js";
import { dataScaffold } from "./data/scaffold.js";
import { dataStatus } from "./data/status.js";
import { dataUp } from "./data/up.js";

export function dataCommands(program: Command) {
	const data = program.command("data").description("Data commands");
	console.log("HELLO");
	dataApply(data);
	dataUp(data);
	dataDown(data);
	dataStatus(data);
	dataScaffold(data);
}
