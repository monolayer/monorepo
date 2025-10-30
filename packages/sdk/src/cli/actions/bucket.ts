import type { Command } from "@commander-js/extra-typings";
import { camelCase, kebabCase } from "case-anything";
import { execSync } from "child_process";
import { exit } from "process";
import prompts from "prompts";
import { addBucketWorkload } from "~workloads/scaffolding/bucket-workload.js";

export function bucket(command: Command) {
	return command
		.command("bucket")
		.description("add a Bucket workload")
		.option("--skip-components", "Skip component installation")
		.action(async (options) => {
			const bucket = await prompBucketName();

			if (options.skipComponents) {
				addBucketWorkload(bucket);
				return;
			}
			execSync(`npx shadcn@latest add ${registryJSON}`, { stdio: "inherit" });
			addBucketWorkload(bucket);
		});
}

const registryJSON = "http://localhost:3000/r/bucket.json";

async function prompBucketName() {
	let aborted = false;
	const select = await prompts({
		type: "text",
		name: "bucketName",
		message: `Bucket name`,
		initial: "app",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return {
		name: camelCase(select.bucketName),
		id: kebabCase(select.bucketName),
	};
}
