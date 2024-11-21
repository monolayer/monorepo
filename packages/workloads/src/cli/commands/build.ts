import type { Command } from "@commander-js/extra-typings";
import path from "node:path";
import { cwd } from "node:process";
import ora from "ora";
import { Make } from "~workloads/cli/make.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function build(program: Command) {
	return program
		.command("build")
		.description("Build workloads")
		.option("-f, --folder <workloads-folder>", "Path to folder with workloads")
		.action(async (opts) => {
			const workloads = await importWorkloads(opts.folder);
			const spinner = ora();
			spinner.start("Build workloads");
			const workloadMake = new Make(workloads);
			const manifestPath = workloadMake.build();
			spinner.succeed(`${spinner.text}`);
			console.log("");
			console.log(`Manifest: ${path.relative(cwd(), manifestPath)}`);
		});
}
