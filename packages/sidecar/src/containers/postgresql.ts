import { kebabCase } from "case-anything";
import { cwd } from "node:process";
import path from "path";
import { Wait, type StartedTestContainer } from "testcontainers";
import {
	Container,
	type SidecarContainer,
	type StartOptions,
} from "~sidecar/containers/container.js";
import { randomName } from "~sidecar/containers/random-name.js";
import { PostgreSQL } from "~sidecar/resources/postgresql.js";

const POSTGRESQL_SERVER_PORT = 5432;

/**
 * Container for Redis
 */
export class PostgreSQLContainer<C>
	extends Container
	implements SidecarContainer
{
	#resource: PostgreSQL<C>;

	/**
	 * @hideconstructor
	 */
	constructor(resource: PostgreSQL<C>) {
		const name = randomName();
		super({
			resourceId: resource.id,
			name,
			image: PostgreSQL.containerImage,
			portsToExpose: [POSTGRESQL_SERVER_PORT],
			persistenceVolumes: [
				{
					source: path.join(
						cwd(),
						"tmp",
						"container-volumes",
						kebabCase(`${name}-data`),
					),
					target: "/var/lib/postgresql/data",
				},
			],
		});
		this.withEnvironment({
			POSTGRES_PASSWORD: "postgres",
		})
			.withWaitStrategy(
				Wait.forLogMessage(
					/.*database system is ready to accept connections.*/,
					2,
				),
			)
			.withStartupTimeout(120_000);

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
		return url.toString();
	}
}
