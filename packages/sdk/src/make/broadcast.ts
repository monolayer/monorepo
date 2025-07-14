import { kebabCase } from "case-anything";
import path from "path";
import { build } from "tsup";
import { tsupConfig } from "~workloads/make/config.js";
import { requiredFiles } from "~workloads/make/required-filtes.js";
import type { WorkloadImport } from "~workloads/scan/workload-imports.js";

export async function makeBroadcast(broadcastImport: WorkloadImport<unknown>) {
	const workloadId = kebabCase("broadcast");
	const dir = `broadcast/${workloadId}`;
	const broadcastFileName = await buildBroadcast(broadcastImport, dir);
	return {
		path: dir,
		entryPoint: broadcastFileName,
		dockerfileName: "none",
	};
}

async function buildBroadcast(
	broadcastImport: WorkloadImport<unknown>,
	dir: string,
) {
	const config = tsupConfig(
		{ index: broadcastImport.src },
		`.workloads/${dir}`,
		[/(.*)/],
		".cjs",
	);
	// config.noExternal = [
	// 	"@monolayer/sdk",
	// 	"case-anything",
	// 	"@epic-web/remember",
	// 	"cron-parser",
	// ];
	await build(config);
	return "index.mjs";
}

export async function broadcastRequiredFiles(info: {
	path: string;
	entryPoint: string;
}) {
	const taskPath = path.join(".workloads", info.path, info.entryPoint);
	await requiredFiles(taskPath);
}
