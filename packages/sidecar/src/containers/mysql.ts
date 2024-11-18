import { Wait, type StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import { type SidecarContainerSpec } from "~sidecar/containers/container.js";
import type { MySqlDatabase } from "~sidecar/workloads/stateful/mysql-database.js";

const MYSQL_PORT = 3306;

const postgreSQLContainerSpec = {
	/**
	 * Docker image for container
	 *
	 * @defaultValue `postgres:16.5-alpine3.20`
	 */
	containerImage: "mysql:8.4.3",

	/**
	 * Container ports to export to the host.
	 *
	 * The published ports to the host will be assigned randomly when starting the container
	 * and they can be accessed through {@link Container.mappedPorts}
	 *
	 */
	portsToExpose: [MYSQL_PORT],

	environment: {
		MYSQL_ROOT_PASSWORD: "test",
	},

	waitStrategy: Wait.forHealthCheck(),
};

/**
 * Container for PostgreSQL
 */
export class MySQLContainer<C> extends ContainerWithURI {
	#workload: MySqlDatabase<C>;

	username: string;
	password: string;

	/**
	 * @hideconstructor
	 */
	constructor(
		workload: MySqlDatabase<C>,
		options?: Partial<SidecarContainerSpec>,
	) {
		const mergedOptions = {
			...postgreSQLContainerSpec,
			...(options ? options : {}),
		};
		super(workload, mergedOptions);
		this.username = "root";
		this.password = mergedOptions.environment.MYSQL_ROOT_PASSWORD;

		this.withHealthCheck({
			test: [
				"CMD",
				"mysql",
				"-h",
				"127.0.0.1",
				"-u",
				this.username,
				`-p${this.password}`,
				"-e",
				`SELECT CURRENT_USER();`,
			],
			interval: 1000,
			retries: 5,
			startPeriod: 3000,
		});

		this.#workload = workload;
	}

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "mysql://");
		url.hostname = container.getHost();
		url.port = container.getMappedPort(MYSQL_PORT).toString();
		url.pathname = this.#workload.databaseName;
		url.username = this.username;
		url.password = this.password;
		return url.toString();
	}
}
