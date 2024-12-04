import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { makeCron } from "~workloads/beamer/blueprints/code/cron.js";
import { makeTask } from "~workloads/beamer/blueprints/code/task.js";
import {
	manifestJsonSchema,
	type BuildManifest,
	type DatabaseWorkloadInfo,
} from "~workloads/beamer/blueprints/manifest.js";
import type { WorkloadImports } from "~workloads/beamer/scan/workload-imports.js";
import type { Database } from "~workloads/workloads/stateful/database.js";

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
		for (const imported of this.#imports.Task) {
			const info = await makeTask(imported);
			manifest.task.push({
				id: imported.workload.name,
				entryPoint: info.entryPoint,
				path: info.path,
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
		writeFileSync(filePath, JSON.stringify(manifestJsonSchema, null, 2));
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
			task: [],
		};
		return manifest;
	}
}
