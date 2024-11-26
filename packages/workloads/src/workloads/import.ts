import { existsSync } from "fs";
import fs from "fs/promises";
import path from "node:path";
import { cwd, exit } from "node:process";
import color from "picocolors";
import { workloadsConfiguration } from "~workloads/configuration.js";
import {
	assertBucket,
	assertElasticSearch,
	assertMongoDatabase,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
} from "~workloads/containers/admin/assertions.js";
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

interface WorkloadImport<I> {
	src: string;
	workload: I;
}

interface ImportByWorkload {
	PostgresDatabase: WorkloadImport<PostgresDatabase<unknown>>[];
	Mailer: WorkloadImport<Mailer<unknown>>[];
	MySqlDatabase: WorkloadImport<MySqlDatabase<unknown>>[];
	ElasticSearch: WorkloadImport<ElasticSearch<unknown>>[];
	Bucket: WorkloadImport<Bucket<unknown>>[];
	MongoDatabase: WorkloadImport<MongoDatabase<unknown>>[];
	Redis: WorkloadImport<Redis<unknown>>[];
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
			Mailer: [],
			MySqlDatabase: [],
			ElasticSearch: [],
			Bucket: [],
			MongoDatabase: [],
			Redis: [],
		};
	}

	get allWorkloads() {
		return this.#imports.map((i) => i.workload);
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

	get MongoDatabase() {
		return this.#importsByWorkload.MongoDatabase;
	}

	get ElasticSearch() {
		return this.#importsByWorkload.ElasticSearch;
	}

	get Mailer() {
		return this.#importsByWorkload.Mailer;
	}

	get Bucket() {
		return this.#importsByWorkload.Bucket;
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
				case "ElasticSearch":
					assertElasticSearch(workload);
					this.#importsByWorkload[key].push({
						src,
						workload,
					});
					break;
				case "MongoDatabase":
					assertMongoDatabase(workload);
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
