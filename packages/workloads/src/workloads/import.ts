import { importFile } from "@monorepo/utils/import-file.js";
import { Effect } from "effect";
import fs from "fs/promises";
import path from "node:path";
import { cwd } from "node:process";
import { ElasticSearch } from "~workloads/workloads/stateful/elastic-search.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";
import { MongoDb } from "~workloads/workloads/stateful/mongo-db.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";
import type { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleImport = Record<string, any>;

export async function importWorkloads(workloadsFolder: string) {
	const workloadsPath = path.join(cwd(), workloadsFolder);
	const files = await fs.readdir(workloadsPath);

	const workloads: Array<StatefulWorkloadWithClient<unknown>> = [];

	for (const fileName of files) {
		if (fileName.endsWith(".ts") && !fileName.endsWith(".d.ts")) {
			const importPath = path.join(workloadsPath, fileName);
			const imported = await Effect.runPromise(
				importFile<ModuleImport>(importPath),
			);
			for (const [, workload] of Object.entries(imported)) {
				const workloadKind = workload.constructor.name;
				if (validWorkload(workloadKind)) {
					workloads.push(workload);
				}
			}
		}
	}
	return workloads;
}

const validConstructor = [
	PostgresDatabase.name,
	Redis.name,
	Mailer.name,
	MySqlDatabase.name,
	ElasticSearch.name,
	MongoDb.name,
];

function validWorkload(workloadConstructor: string) {
	return validConstructor.includes(workloadConstructor);
}
