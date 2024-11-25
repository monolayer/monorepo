import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import {
	assertBucket,
	assertElasticSearch,
	assertMailer,
	assertMongoDatabase,
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
					this.#addDatabase(workload, manifest.mySqlDatabase);
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
				case "MongoDatabase":
					assertMongoDatabase(workload);
					this.#addDatabase(workload, manifest.mongoDb);
					break;
				case "Bucket":
					assertBucket(workload);
					manifest.bucket.push({
						name: workload.name,
					});
					break;
			}
		}
		return manifest;
	}

	#addDatabase(workload: Database<unknown>, info: DatabaseWorkloadInfo[]) {
		const dbInfo = {
			name: workload.databaseName,
			serverId: workload.databaseId,
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
			mySqlDatabase: [],
			redis: [],
			elasticSearch: [],
			mailer: [],
			mongoDb: [],
			bucket: [],
		};
		return manifest;
	}
}

interface BuildManifest {
	version: string;
	postgresDatabase: DatabaseWorkloadInfo[];
	mySqlDatabase: DatabaseWorkloadInfo[];
	redis: WorkloadInfo[];
	elasticSearch: WorkloadInfo[];
	mongoDb: DatabaseWorkloadInfo[];
	mailer: WorkloadInfo[];
	bucket: BucketInfo[];
}

interface DatabaseWorkloadInfo {
	id: string;
	databases: {
		name: string;
		serverId: string;
		connectionStringEnvVar: string;
	}[];
}

interface WorkloadInfo {
	id: string;
	connectionStringEnvVar: string;
}

interface BucketInfo {
	name: string;
}

export const schema = {
	$schema: "https://json-schema.org/draft/2020-12/schema",
	type: "object",
	$id: "workloads-build-manifest-schema-v1",
	title: "WorkloadsBuildManifest",
	properties: {
		version: {
			type: "string",
			enum: ["1"],
			description:
				"The version of the schema. This must be '1' for version 1 of the schema.",
		},
		postgresDatabase: {
			type: "array",
			items: {
				$ref: "#/$defs/DatabaseWorkloadInfo",
			},
		},
		mySqlDatabase: {
			type: "array",
			items: {
				$ref: "#/$defs/DatabaseWorkloadInfo",
			},
		},
		redis: {
			type: "array",
			items: {
				$ref: "#/$defs/WorkloadInfo",
			},
		},
		elasticSearch: {
			type: "array",
			items: {
				$ref: "#/$defs/WorkloadInfo",
			},
		},
		mongoDb: {
			type: "array",
			items: {
				$ref: "#/$defs/DatabaseWorkloadInfo",
			},
		},
		mailer: {
			type: "array",
			items: {
				$ref: "#/$defs/WorkloadInfo",
				description: "Array of Mailer",
			},
		},
		bucket: {
			type: "array",
			items: {
				$ref: "#/$defs/BucketInfo",
				description: "Array of Bucket",
			},
		},
	},
	required: [
		"postgresDatabase",
		"mysqlDatabase",
		"redis",
		"elasticSearch",
		"mongoDb",
		"mailer",
		"bucket",
	],
	$defs: {
		DatabaseWorkloadInfo: {
			type: "object",
			properties: {
				id: { type: "string" },
				databases: {
					type: "array",
					items: {
						$ref: "#/$defs/Database",
					},
				},
			},
			required: ["id", "databases"],
		},
		Database: {
			type: "object",
			properties: {
				name: { type: "string" },
				serverId: { type: "string" },
				connectionStringEnvVar: { type: "string" },
			},
			required: ["name", "connectionStringEnvVar"],
		},
		WorkloadInfo: {
			type: "object",
			properties: {
				id: {
					type: "string",
				},
				connectionStringEnvVar: {
					type: "string",
				},
			},
			required: ["id", "connectionStringEnvVar"],
		},
		BucketInfo: {
			type: "object",
			properties: {
				name: {
					type: "string",
				},
			},
			required: ["name"],
		},
	},
};
