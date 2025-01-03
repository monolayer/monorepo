import type { Command } from "@commander-js/extra-typings";
import path from "node:path";
import { cwd } from "node:process";
import ora from "ora";
import { Make } from "~workloads/make/make.js";
import { importWorkloads } from "~workloads/scan/workload-imports.js";

export function build(program: Command) {
	return program
		.command("build")
		.description("build workloads")
		.action(async () => {
			const imports = await importWorkloads();
			const spinner = ora();
			spinner.start("Build workloads");
			const workloadMake = new Make(imports);
			const manifestPath = await workloadMake.build();
			spinner.succeed(`${spinner.text}`);
			console.log("");
			console.log(`Manifest: ${path.relative(cwd(), manifestPath)}`);
		});
}
