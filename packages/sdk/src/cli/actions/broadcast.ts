import type { Command } from "@commander-js/extra-typings";
import { execSync } from "child_process";

const registryJSON = "https://registry.monolayer.dev/r/broadcast.json";

export function broadcast(command: Command) {
	return command
		.command("broadcast")
		.description("add a Broadcast workload")
		.action(async () => {
			execSync(`npx shadcn@latest add ${registryJSON}`, { stdio: "inherit" });
		});
}
