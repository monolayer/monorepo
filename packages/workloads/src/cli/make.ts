/* eslint-disable max-lines */
import { kebabCase } from "case-anything";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { build } from "tsup";
import type {
	WorkloadImport,
	WorkloadImports,
} from "~workloads/workloads/import.js";
import type { Database } from "~workloads/workloads/stateful/database.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";

export class Make {
	#imports: WorkloadImports;

	constructor(workloads: WorkloadImports) {
		this.#imports = workloads;
	}
	async build() {
		this.#setupBuildDirectory();
		const manifest = await this.#collectWorkloads();
		const manifestFilePath = this.#writeManifestFile(manifest);
		this.#writeSchemaFile();
		return manifestFilePath;
	}

	async #collectWorkloads() {
		const manifest = this.#initManifest();
		for (const imported of this.#imports.Mailer) {
			manifest.mailer.push({
				id: imported.workload.id,
				connectionStringEnvVar: imported.workload.connectionStringEnvVar,
			});
		}
		for (const imported of this.#imports.Redis) {
			manifest.redis.push({
				id: imported.workload.id,
				connectionStringEnvVar: imported.workload.connectionStringEnvVar,
			});
		}
		for (const imported of this.#imports.ElasticSearch) {
			manifest.elasticSearch.push({
				id: imported.workload.id,
				connectionStringEnvVar: imported.workload.connectionStringEnvVar,
			});
		}
		for (const imported of this.#imports.Bucket) {
			manifest.bucket.push({
				name: imported.workload.id,
			});
		}
		for (const imported of [
			...this.#imports.PostgresDatabase,
			...this.#imports.MongoDatabase,
			...this.#imports.MySqlDatabase,
		]) {
			this.#addDatabase(imported.workload, manifest.postgresDatabase);
		}
		for (const imported of this.#imports.Cron) {
			const info = await makeCron(imported);
			manifest.cron.push({
				id: imported.workload.id,
				entryPoint: info.entryPoint,
				path: info.path,
				schedule: imported.workload.schedule,
			});
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

	#setupBuildDirectory() {
		if (existsSync(this.#buildDir)) {
			rmSync(this.#buildDir, {
				recursive: true,
				force: true,
			});
		} else {
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
			cron: [],
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
	cron: CronInto[];
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

interface CronInto {
	id: string;
	path: string;
	entryPoint: string;
	schedule: string;
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
		cron: {
			type: "array",
			items: {
				$ref: "#/$defs/CronInfo",
				description: "Array of Cron",
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
		"cron",
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
		CronInfo: {
			type: "object",
			properties: {
				id: {
					type: "string",
				},
				path: {
					type: "string",
				},
				entryPoint: {
					type: "string",
				},
				schedule: {
					type: "string",
				},
			},
			required: ["id", "path", "entryPoint", "schedule"],
		},
	},
};

async function makeCron(cronImport: WorkloadImport<Cron>) {
	const dir = `crons/${kebabCase(cronImport.workload.id)}`;
	await build({
		outExtension({ format }) {
			switch (format) {
				case "cjs":
					return {
						js: `.js`,
					};
				case "iife":
					return {
						js: `.global.js`,
					};
				case "esm":
					return {
						js: `.mjs`,
					};
			}
		},
		format: ["esm"],
		entry: [cronImport.src],
		outDir: `.workloads/${dir}`,
		dts: false,
		shims: false,
		skipNodeModulesBundle: false,
		clean: true,
		target: "node20",
		platform: "node",
		minify: false,
		bundle: true,
		noExternal: [],
		splitting: true,
		cjsInterop: true,
		treeshake: true,
		sourcemap: true,
		silent: true,
	});
	return {
		path: dir,
		entryPoint: `${path.parse(cronImport.src).name}.mjs`,
	};
}
