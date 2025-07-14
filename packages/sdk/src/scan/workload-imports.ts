import { existsSync } from "fs";
import fs from "fs/promises";
import path from "node:path";
import { cwd, exit } from "node:process";
import color from "picocolors";
import { workloadsConfiguration } from "~workloads/configuration.js";
import {
	type Bucket,
	type Cron,
	type MySqlDatabase,
	type PostgresDatabase,
	type Redis,
	type Task,
} from "~workloads/workloads.js";
import {
	assertBroadcast,
	assertBucket,
	assertCron,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
	assertTask,
} from "~workloads/workloads/assertions.js";

import type { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";
import type { AnyBroadcast } from "~workloads/workloads/stateless/broadcast/router.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleImport = Record<string, any>;

export async function importWorkloads() {
	const workloadsPath = path.join(
		cwd(),
		(await workloadsConfiguration()).workloadsPath,
	);

	if (!existsSync(workloadsPath)) {
		console.log(`${color.red("error")} Workloads folder not found`);
		console.log("Check your configuration file: ./monolayer.config.ts");
		exit(1);
	}

	const files = await fs.readdir(workloadsPath);
	const imports = new WorkloadImports();

	for (const fileName of files) {
		if (fileName.endsWith(".ts") && !fileName.endsWith(".d.ts")) {
			const importPath = path.join(workloadsPath, fileName);
			const imported = (await import(importPath)) as ModuleImport;
			for (const [, workload] of Object.entries(imported)) {
				if (workload !== undefined) {
					const workloadKind = workload.constructor.name;
					const workloadPath = path.relative(cwd(), importPath);
					if (validWorkload(workloadKind)) {
						imports.add(workloadPath, workload);
					}
				}
			}
		}
	}
	return imports;
}

const validConstructor = [
	"PostgresDatabase",
	"Redis",
	"MySqlDatabase",
	"Bucket",
	"Cron",
	"Task",
	"Broadcast",
];

function validWorkload(workloadConstructor: string) {
	return validConstructor.includes(workloadConstructor);
}

export interface WorkloadImport<I> {
	src: string;
	workload: I;
}

interface ImportByWorkload {
	PostgresDatabase: WorkloadImport<PostgresDatabase>[];
	MySqlDatabase: WorkloadImport<MySqlDatabase>[];
	Bucket: WorkloadImport<Bucket>[];
	Redis: WorkloadImport<Redis>[];
	Cron: WorkloadImport<Cron>[];
	Task: WorkloadImport<Task<unknown>>[];

	Broadcast: WorkloadImport<AnyBroadcast>[];
}

export class WorkloadImports {
	#importsByWorkload: ImportByWorkload;
	#imports: Array<{
		src: string;
		workload: StatefulWorkloadWithClient;
	}> = [];

	constructor() {
		this.#importsByWorkload = {
			PostgresDatabase: [],
			MySqlDatabase: [],
			Bucket: [],
			Redis: [],
			Cron: [],
			Task: [],
			Broadcast: [],
		};
	}

	get workloadsWithContainers() {
		return [
			...this.Bucket,
			...this.MySqlDatabase,
			...this.PostgresDatabase,
			...this.Redis,
			...this.Broadcast,
		].map((i) => i.workload);
	}

	get Redis() {
		return this.#importsByWorkload.Redis;
	}

	get MySqlDatabase() {
		return this.#importsByWorkload.MySqlDatabase;
	}

	get PostgresDatabase() {
		return this.#importsByWorkload.PostgresDatabase;
	}

	get Bucket() {
		return this.#importsByWorkload.Bucket;
	}

	get Cron() {
		return this.#importsByWorkload.Cron;
	}

	get Task() {
		return this.#importsByWorkload.Task;
	}

	get Broadcast() {
		return this.#importsByWorkload.Broadcast;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	addBroadcast(src: string, workload: any) {
		this.#importsByWorkload.Broadcast = [{ src, workload }];
	}

	add(src: string, workload: StatefulWorkloadWithClient) {
		if (validWorkload(workload.constructor.name)) {
			const key = workload.constructor.name as keyof ImportByWorkload;
			if (this.#importsByWorkload[key] === undefined) {
				this.#importsByWorkload[key] = [];
			}
			switch (key) {
				case "Redis":
					assertRedis(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
				case "MySqlDatabase":
					assertMySqlDatabase(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
				case "Bucket":
					assertBucket(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
				case "PostgresDatabase":
					assertPostgresDatabase(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
				case "Cron":
					assertCron(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
				case "Task":
					assertTask(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
				case "Broadcast":
					assertBroadcast(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
			}
		}
		this.#imports.push({
			src,
			workload,
		});
	}
}
