import { importFile } from "@monorepo/utils/import-file.js";
import { Effect } from "effect";
import fs from "fs/promises";
import path from "node:path";
import { cwd } from "node:process";
import type { ElasticSearch } from "~sidecar/workloads/stateful/elastic-search.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";
import type { MongoDb } from "~sidecar/workloads/stateful/mongo-db.js";
import type { MySqlDatabase } from "~sidecar/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import type { Redis } from "~sidecar/workloads/stateful/redis.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleImport = Record<string, any>;

export async function importWorkloads(workloadsFolder: string) {
	const workloadsPath = path.join(cwd(), workloadsFolder);
	const files = await fs.readdir(workloadsPath);

	const workloads: WorkloadByKind = {
		Mailer: [],
		PostgresDatabase: [],
		Redis: [],
		MySqlDatabase: [],
		ElasticSearch: [],
		MongoDb: [],
	};

	for (const fileName of files) {
		if (fileName.endsWith(".ts") && !fileName.endsWith(".d.ts")) {
			const importPath = path.join(workloadsPath, fileName);
			const imported = await Effect.runPromise(
				importFile<ModuleImport>(importPath),
			);
			for (const [, workload] of Object.entries(imported)) {
				const workloadKind = workload.constructor.name;
				if (validWorkload(workloadKind)) {
					const key = workloadKind as keyof WorkloadByKind;
					workloads[key].push(workload);
				}
			}
		}
	}
	return workloads;
}

export interface WorkloadByKind {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Mailer: Array<Mailer<any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	PostgresDatabase: Array<PostgresDatabase<any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Redis: Array<Redis<any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	MySqlDatabase: Array<MySqlDatabase<any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ElasticSearch: Array<ElasticSearch<any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	MongoDb: Array<MongoDb<any>>;
}

const validConstructor = [
	"PostgresDatabase",
	"Redis",
	"Mailer",
	"MySqlDatabase",
	"ElasticSearch",
	"MongoDb",
];

function validWorkload(workloadConstructor: string) {
	return validConstructor.includes(workloadConstructor);
}
