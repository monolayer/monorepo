import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { createPostgresDatabase } from "~workloads/containers/admin/create-database.js";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~workloads/containers/container.js";
import { assertPostgresDatabase } from "~workloads/workloads/assertions.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

/**
 * Container for PostgreSQL
 */
export class PostgreSQLContainer extends ContainerWithURI {
	/**
	 * @hideconstructor
	 */
	constructor(workload: PostgresDatabase) {
		super(workload);
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "postgres:16.5-alpine3.20",
		portsToExpose: [5432],
		environment: {
			POSTGRES_PASSWORD: "postgres",
		},
		waitStrategy: Wait.forHealthCheck(),
		startupTimeout: 6000,
		healthCheck: {
			test: ["CMD", "pg_isready", "-U", "postgres"],
			interval: 1000,
			retries: 5,
			startPeriod: 1000,
		} satisfies HealthCheck,
	};

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "postgresql://");
		url.hostname = container.getHost();
		url.username = "postgres";
		url.password = "postgres";
		url.port = container
			.getMappedPort(this.definition.portsToExpose[0]!)
			.toString();
		url.pathname = (this.workload as PostgresDatabase).databaseName;
		return url.toString();
	}

	async afterStart() {
		await super.afterStart();
		assertPostgresDatabase(this.workload);
		await createPostgresDatabase(this.workload);
	}
}
