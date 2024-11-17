import { importFile } from "@monorepo/utils/import-file.js";
import { Effect } from "effect";
import fs from "fs/promises";
import path from "node:path";
import { cwd } from "node:process";
import type { Bucket } from "~sidecar/workloads/stateful/bucket.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";
import type { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import type { Redis } from "~sidecar/workloads/stateful/redis.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleImport = Record<string, any>;

export async function importWorkloads() {
	const mods = await importModules();
	return classifyWorkloads(mods);
}

async function importModules() {
	const workloadsPath = path.join(cwd(), "src", "workloads");
	const files = await fs.readdir(workloadsPath);

	let modules: ModuleImport = {};

	for (const fileName of files) {
		if (fileName.endsWith(".ts") && !fileName.endsWith(".d.ts")) {
			const importPath = path.join(workloadsPath, fileName);
			const imported = await Effect.runPromise(
				importFile<ModuleImport>(importPath),
			);
			modules = {
				...modules,
				...imported,
			};
		}
	}
	return modules;
}

export interface WorkloadByKind {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Mailer: Array<Mailer<any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	PostgresDatabase: Array<PostgresDatabase<any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Redis: Array<Redis<any>>;
	Bucket: Array<Bucket>;
}

function classifyWorkloads(workloads: ModuleImport) {
	return Object.entries(workloads).reduce<WorkloadByKind>(
		(acc, [, workload]) => {
			const workloadKind = workload.constructor.name;
			if (validWorkload(workloadKind)) {
				const key = workloadKind as keyof WorkloadByKind;
				if (acc[key] === undefined) {
					acc[key] = [];
				}
				acc[key].push(workload);
			}
			return acc;
		},
		{ Mailer: [], PostgresDatabase: [], Bucket: [], Redis: [] },
	);
}

const validConstructor = ["PostgresDatabase", "Redis", "Bucket", "Mailer"];

function validWorkload(workloadConstructor: string) {
	return validConstructor.includes(workloadConstructor);
}
