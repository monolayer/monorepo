import { remember } from "@epic-web/remember";
import path from "node:path";
import { cwd } from "node:process";

export interface Configuration {
	/**
	 * Path to a folder with workloads.
	 *
	 */
	workloadsPath: string;
	/**
	 * Docker images for workloads
	 */
	containerImages?: {
		/**
		 * @default postgres:16.5-alpine3.20
		 */
		postgresDatabase?: string;
		/**
		 * @default redis:7.4.1-alpine3.20
		 */
		redis?: string;
		/**
		 * @default elasticsearch:7.17.25
		 */
		elasticSearch?: string;
		/**
		 * @default mysql:8.4.3
		 */
		mySqlDatabase?: string;
		/**
		 * @default axllent/mailpit:v1.21.3
		 */
		mailer?: string;
		/**
		 * @default mongo:7.0.15
		 */
		mongoDb?: string;
	};
}

async function importConfig(): Promise<Configuration> {
	const imported = await import(path.join(cwd(), "workloads.config.ts"));
	return imported.default && imported.default.default
		? imported.default.default
		: imported.default;
}

export const workloadsConfiguration = () =>
	remember("workloadsConfiguration", async () => await importConfig());
