import { existsSync } from "fs";
import fs from "fs/promises";
import path from "node:path";
import { cwd, exit } from "node:process";
import color from "picocolors";
import { workloadsConfiguration } from "~workloads/configuration.js";
import { Bucket } from "~workloads/workloads/stateful/bucket.js";
import { ElasticSearch } from "~workloads/workloads/stateful/elastic-search.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";
import { MongoDatabase } from "~workloads/workloads/stateful/mongo-database.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";
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
				const workloadKind = workload.constructor.name;
				if (validWorkload(workloadKind)) {
					const workloadPath = path.relative(cwd(), importPath);
					imports.add(workloadPath, workload);
				}
			}
		}
	}
	return imports;
}

const validConstructor = [
	PostgresDatabase.name,
	Redis.name,
	Mailer.name,
	MySqlDatabase.name,
	ElasticSearch.name,
	MongoDatabase.name,
	Bucket.name,
];

function validWorkload(workloadConstructor: string) {
	return validConstructor.includes(workloadConstructor);
}

export class WorkloadImports {
	imports: Array<{
		src: string;
		workload: StatefulWorkloadWithClient<unknown>;
	}> = [];

	get workloads() {
		return this.imports.map((i) => i.workload);
	}

	add(src: string, workload: StatefulWorkloadWithClient<unknown>) {
		this.imports.push({
			src,
			workload,
		});
	}
}
