import { kebabCase } from "case-anything";
import path from "node:path";
import { tsupConfig } from "~workloads/make/tsup.js";
import type { WorkloadImport } from "~workloads/workloads/import.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";

export async function makeCron(cronImport: WorkloadImport<Cron>) {
	const dir = `crons/${kebabCase(cronImport.workload.id)}`;
	tsupConfig([cronImport.src], `.workloads/${dir}`, []);

	return {
		path: dir,
		entryPoint: `${path.parse(cronImport.src).name}.mjs`,
	};
}
