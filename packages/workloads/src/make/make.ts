import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { makeCron } from "~workloads/make/cron.js";
import {
	manifestJsonSchema,
	type BuildManifest,
	type DatabaseWorkloadInfo,
} from "~workloads/make/manifest.js";
import { makeTask, taskRequiredFiles } from "~workloads/make/task.js";
import { projectFramework } from "~workloads/scan/project.js";
import type { WorkloadImports } from "~workloads/scan/workload-imports.js";
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
		const manifest = await this.#initManifest();
		for (const imported of this.#imports.Redis) {
			manifest.redis.push({
				id: imported.workload.id,
				connectionStringEnvVar: imported.workload.connectionStringEnvVar,
			});
		}
		for (const imported of this.#imports.Bucket) {
			manifest.bucket.push({
				id: imported.workload.id,
			});
		}
		for (const imported of [
			...this.#imports.PostgresDatabase,
			...this.#imports.MySqlDatabase,
		]) {
			this.#addDatabase(imported.workload, manifest.postgresDatabase);
		}
		for (const imported of this.#imports.Cron) {
			const info = await makeCron(imported);
			const cronInfo = {
				id: imported.workload.id,
				entryPoint: info.entryPoint,
				path: info.path,
				schedule: imported.workload.schedule,
			};
			manifest.cron.push(cronInfo);
			await taskRequiredFiles(cronInfo);
		}
		for (const imported of this.#imports.Task) {
			const info = await makeTask(imported);
			const taskInfo = {
				id: imported.workload.name,
				entryPoint: info.entryPoint,
				path: info.path,
			};
			manifest.task.push(taskInfo);
			await taskRequiredFiles(taskInfo);
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
		}
		mkdirSync(this.#buildDir);
	}

	async #initManifest() {
		const manifest: BuildManifest = {
			version: "2",
			framework: (await projectFramework()) ?? "",
			postgresDatabase: [],
			mySqlDatabase: [],
			redis: [],
			bucket: [],
			cron: [],
			task: [],
		};
		return manifest;
	}
}
