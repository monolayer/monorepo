import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { schema } from "~workloads/cli/make/schema.js";
import {
	assertElasticSearch,
	assertMailer,
	assertMongoDb,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
} from "~workloads/containers/admin/assertions.js";
import type { Database } from "~workloads/workloads/stateful/database.js";
import type { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

export class Make {
	#workloads;

	constructor(workloads: StatefulWorkloadWithClient<unknown>[]) {
		this.#workloads = workloads;
	}
	build() {
		this.#createBuildDirectory();
		const manifest = this.#collectWorkloads();
		const manifestFilePath = this.#writeManifestFile(manifest);
		this.#writeSchemaFile();
		return manifestFilePath;
	}

	#collectWorkloads() {
		const manifest = this.#initManifest();
		for (const workload of this.#workloads) {
			switch (workload.constructor.name) {
				case "Redis":
					assertRedis(workload);
					manifest.redis.push({
						id: workload.id,
						connectionStringEnvVar: workload.connectionStringEnvVar,
					});
					break;
				case "Mailer":
					assertMailer(workload);
					manifest.mailer.push({
						id: workload.id,
						connectionStringEnvVar: workload.connectionStringEnvVar,
					});
					break;
				case "MySqlDatabase":
					assertMySqlDatabase(workload);
					this.#addDatabase(workload, manifest.mysqlDatabase);
					break;
				case "PostgresDatabase":
					assertPostgresDatabase(workload);
					this.#addDatabase(workload, manifest.postgresDatabase);
					break;
				case "ElasticSearch":
					assertElasticSearch(workload);
					manifest.elasticSearch.push({
						id: workload.id,
						connectionStringEnvVar: workload.connectionStringEnvVar,
					});
					break;
				case "MongoDb":
					assertMongoDb(workload);
					this.#addDatabase(workload, manifest.mongoDb);
					break;
			}
		}
		return manifest;
	}

	#addDatabase(workload: Database<unknown>, info: DatabaseWorkloadInfo[]) {
		const dbInfo = {
			name: workload.databaseName,
			connectionStringEnvVar: workload.connectionStringEnvVar,
		};
		const existingDb = info.find((d) => d.id === workload.id);
		if (existingDb) {
			existingDb.databases.push(dbInfo);
		} else {
			info.push({
				id: workload.id,
				databases: [dbInfo],
			});
		}
	}
	#writeManifestFile(manifest: BuildManifest) {
		const filePath = path.join(this.#buildDir, "manifest.json");
		writeFileSync(filePath, JSON.stringify(manifest, null, 2));
		return filePath;
	}

	#writeSchemaFile() {
		const filePath = path.join(this.#buildDir, "schema.json");
		writeFileSync(filePath, JSON.stringify(schema, null, 2));
	}

	get #buildDir() {
		return path.join(cwd(), ".workloads");
	}

	#createBuildDirectory() {
		if (!existsSync(this.#buildDir)) {
			mkdirSync(this.#buildDir);
		}
	}

	#initManifest() {
		const manifest: BuildManifest = {
			version: "1",
			postgresDatabase: [],
			mysqlDatabase: [],
			redis: [],
			elasticSearch: [],
			mailer: [],
			mongoDb: [],
		};
		return manifest;
	}
}

interface BuildManifest {
	version: string;
	postgresDatabase: DatabaseWorkloadInfo[];
	mysqlDatabase: DatabaseWorkloadInfo[];
	redis: WorkloadInfo[];
	elasticSearch: WorkloadInfo[];
	mongoDb: DatabaseWorkloadInfo[];
	mailer: WorkloadInfo[];
}

interface DatabaseWorkloadInfo {
	id: string;
	databases: {
		name: string;
		connectionStringEnvVar: string;
	}[];
}

interface WorkloadInfo {
	id: string;
	connectionStringEnvVar: string;
}
