import { Wait, type StartedTestContainer } from "testcontainers";
import type { HealthCheck } from "testcontainers/build/types.js";
import { ContainerWithURI } from "~sidecar/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~sidecar/containers/container.js";
import type { MySqlDatabase } from "~sidecar/workloads/stateful/mysql-database.js";

/**
 * Container for PostgreSQL
 */
export class MySQLContainer<C> extends ContainerWithURI {
	username: string;
	password: string;

	/**
	 * @hideconstructor
	 */
	constructor(workload: MySqlDatabase<C>) {
		super(workload);
		this.username = "root";
		this.password = this.definition.environment.MYSQL_ROOT_PASSWORD ?? "";
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "mysql:8.4.3",
		portsToExpose: [3306],
		environment: {
			MYSQL_ROOT_PASSWORD: "test",
		},
		waitStrategy: Wait.forHealthCheck(),
		healthCheck: {
			test: [
				"CMD-SHELL",
				"mysqladmin -h 'localhost' -u root -ptest ping --silent",
			],
			interval: 1000,
			retries: 5,
			startPeriod: 6000,
		} satisfies HealthCheck,
	};

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "mysql://");
		url.hostname = container.getHost();
		url.port = container
			.getMappedPort(this.definition.portsToExpose[0]!)
			.toString();
		url.pathname = (this.workload as MySqlDatabase<C>).databaseName;
		url.username = this.username;
		url.password = this.password;
		return url.toString();
	}
}
