import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~sidecar/containers/container.js";
import { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";

/**
 * Container for PostgreSQL
 */
export class PostgreSQLContainer<C> extends ContainerWithURI {
	/**
	 * @hideconstructor
	 */
	constructor(workload: PostgresDatabase<C>) {
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
		url.pathname = (this.workload as PostgresDatabase<C>).databaseName;
		return url.toString();
	}
}
