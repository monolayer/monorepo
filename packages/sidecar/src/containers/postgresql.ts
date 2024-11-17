import { Wait, type StartedTestContainer } from "testcontainers";
import {
	Container,
	type SidecarContainer,
	type SidecarContainerSpec,
	type StartOptions,
} from "~sidecar/containers/container.js";
import { PostgresDatabase } from "~sidecar/resources/postgres-database.js";

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
		POSTGRES_DB: "postgres",
	},

	waitStrategy: Wait.forLogMessage(
		/.*database system is ready to accept connections.*/,
		2,
	),

	startupTimeout: 120_000,

	persistentVolumeTargets: ["/var/lib/postgresql/data"],
};

/**
 * Container for PostgreSQL
 */
export class PostgreSQLContainer<C>
	extends Container
	implements SidecarContainer
{
	#resource: PostgresDatabase<C>;

	/**
	 * @hideconstructor
	 */
	constructor(
		resource: PostgresDatabase<C>,
		options?: Partial<SidecarContainerSpec>,
	) {
		super({
			resource,
			containerSpec: {
				...postgreSQLContainerSpec,
				...(options ? options : {}),
			},
		});
		this.#resource = resource;
	}

	override async start(options?: StartOptions) {
		const startedContainer = await super.start(
			options ?? {
				persistenceVolumes: true,
				reuse: true,
			},
		);
		process.env[this.#resource.connectionStringEnvVar()] =
			this.#generateURI(startedContainer);
		return startedContainer;
	}

	/**
	 * @returns The PostgreSQL server connection string URI
	 * in the form of `postgresql://username:password@host:port`
	 * or `undefined` if the container has not started.
	 */
	get connectionURI() {
		if (this.startedContainer) {
			return this.#generateURI(this.startedContainer);
		}
	}
	#generateURI(startedContainer: StartedTestContainer) {
		const url = new URL("", "postgresql://");
		url.hostname = startedContainer.getHost();
		url.username = "postgres";
		url.password = "postgres";
		url.port = startedContainer
			.getMappedPort(POSTGRESQL_SERVER_PORT)
			.toString();
		url.pathname = this.#resource.databaseName;
		return url.toString();
	}
}
