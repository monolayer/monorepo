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
	assertBucket,
	assertCron,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
	assertTask,
} from "~workloads/workloads/assertions.js";

import type { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleImport = Record<string, any>;

export async function importWorkloads() {
	const workloadsPath = path.join(
		cwd(),
		(await workloadsConfiguration()).workloadsPath,
	);

	if (!existsSync(workloadsPath)) {
		console.log(`${color.red("error")} Workloads folder not found`);
		console.log("Check your configuration file: ./workloads.config.ts");
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
					if (validWorkload(workloadKind)) {
						const workloadPath = path.relative(cwd(), importPath);
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
];

function validWorkload(workloadConstructor: string) {
	return validConstructor.includes(workloadConstructor);
}

export interface WorkloadImport<I> {
	src: string;
	workload: I;
}

interface ImportByWorkload {
	PostgresDatabase: WorkloadImport<PostgresDatabase<unknown>>[];
	MySqlDatabase: WorkloadImport<MySqlDatabase<unknown>>[];
	Bucket: WorkloadImport<Bucket<unknown>>[];
	Redis: WorkloadImport<Redis<unknown>>[];
	Cron: WorkloadImport<Cron>[];
	Task: WorkloadImport<Task<unknown>>[];
}

export class WorkloadImports {
	#importsByWorkload: ImportByWorkload;
	#imports: Array<{
		src: string;
		workload: StatefulWorkloadWithClient<unknown>;
	}> = [];

	constructor() {
		this.#importsByWorkload = {
			PostgresDatabase: [],
			MySqlDatabase: [],
			Bucket: [],
			Redis: [],
			Cron: [],
			Task: [],
		};
	}

	get workloadsWithContainers() {
		return [
			...this.Bucket,
			...this.MySqlDatabase,
			...this.PostgresDatabase,
			...this.Redis,
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

	add(src: string, workload: StatefulWorkloadWithClient<unknown>) {
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
			}
		}
		this.#imports.push({
			src,
			workload,
		});
	}
}
