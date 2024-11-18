import { Wait, type StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import { type SidecarContainerSpec } from "~sidecar/containers/container.js";
import { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";

const POSTGRESQL_SERVER_PORT = 5432;

const postgreSQLContainerSpec = {
	/**
	 * Docker image for container
	 *
	 * @defaultValue `postgres:16.5-alpine3.20`
	 */
	containerImage: "postgres:16.5-alpine3.20",

	/**
	 * Container ports to export to the host.
	 *
	 * The published ports to the host will be assigned randomly when starting the container
	 * and they can be accessed through {@link Container.mappedPorts}
	 *
	 */
	portsToExpose: [POSTGRESQL_SERVER_PORT],

	environment: {
		POSTGRES_PASSWORD: "postgres",
	},

	waitStrategy: Wait.forHealthCheck(),

	startupTimeout: 6000,
};

/**
 * Container for PostgreSQL
 */
export class PostgreSQLContainer<C> extends ContainerWithURI {
	#workload: PostgresDatabase<C>;

	/**
	 * @hideconstructor
	 */
	constructor(
		workload: PostgresDatabase<C>,
		options?: Partial<SidecarContainerSpec>,
	) {
		super(workload, {
			...postgreSQLContainerSpec,
			...(options ? options : {}),
		});
		this.withHealthCheck({
			test: ["CMD", "pg_isready", "-U", "postgres"],
			interval: 1000,
			retries: 5,
			startPeriod: 1000,
		});

		this.#workload = workload;
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "postgresql://");
		url.hostname = container.getHost();
		url.username = "postgres";
		url.password = "postgres";
		url.port = container.getMappedPort(POSTGRESQL_SERVER_PORT).toString();
		url.pathname = this.#workload.databaseName;
		return url.toString();
	}
}
