import { remember } from "@epic-web/remember";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";

export interface Configuration {
	/**
	 * Path to a folder with workloads.
	 *
	 */
	workloadsPath: string;
	/**
	 * Container configurations.
	 */
	containers?: {
		/**
		 * @default { imageName: "postgres:16.5-alpine3.20", exposedPorts: [ container: 5432, host: 5432 ] }
		 */
		postgresDatabase?: ContainerConfig;
		/**
		 * @default
		 * { imageName: "redis:7.4.1-alpine3.20", exposedPorts: [ container: 6379, host: 6379 ] }
		 */
		redis?: ContainerConfig;
		/**
		 * @default
		 * { imageName: "elasticsearch:7.17.25", exposedPorts: [ container: 9200, host: 9200 ] }
		 */
		elasticSearch?: ContainerConfig;
		/**
		 * @default
		 * { imageName: "mysql:8.4.3", exposedPorts: [ container: 3306, host: 3306 ] }
		 */
		mySqlDatabase?: ContainerConfig;
		/**
		 * @default
		 * { imageName: "axllent/mailpit:v1.21.3", exposedPorts: [ container: 1025, host: 1025 ] }
		 */
		mailer?: ContainerConfig;
		/**
		 * @default
		 * { imageName: "mongo:7.0.15", exposedPorts: [ container: 27017, host: 27017 ] }
		 */
		mongoDb?: ContainerConfig;
		/**
		 * @default
		 * { imageName: "localstack/localstack:3.8.1", exposedPorts: [ container: 4566, host: 4566 ] }
		 */
		localStack?: ContainerConfig;
	};

	/**
	 * Names of the dotenv files to write the workloads' connection strings.
	 */
	envFileName?: {
		/**
		 * File name for development,
		 */
		development?: string;
		/**
		 * File name for test,
		 */
		test?: string;
	};
}

export interface ContainerConfig {
	/**
	 * Docker image name.
	 */
	imageName?: string;
	/**
	 * Host port to publish the exposed container port.
	 */
	exposedPorts?: {
		container: number;
		host: number;
	}[];
}

async function importConfig(): Promise<Configuration> {
	const imported = await import(path.join(cwd(), "workloads.config.ts"));
	return imported.default && imported.default.default
		? imported.default.default
		: imported.default;
}

export const workloadsConfiguration = () =>
	remember("workloadsConfiguration", async () => await importConfig());

export const packageName = remember("packageName", () => {
	const packageJSON = JSON.parse(readFileSync("package.json").toString());
	return packageJSON.name;
});
