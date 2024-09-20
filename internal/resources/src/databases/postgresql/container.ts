import { kebabCase, snakeCase } from "case-anything";
import path from "node:path";
import { Container } from "~resources/_lib/container.js";
import { StartedServerContainer } from "~resources/_lib/started-container.js";
import { updateEnvVar } from "~resources/write-env.js";

const POSTGRESQL_ = "sibedge/postgres-plv8";
const POSTGRESQL_IMAGE_TAG = "latest";
const POSTGRESQL_SERVER_PORT = 5432;

export interface PostgreSQLContainerOptions {
	resourceId: string;
	imageTag?: string;
	connectionStringEnvVarNames?: string[];
}

export class PostgreSQLContainer extends Container {
	#connectionStringEnvVarNames?: string[];

	constructor(options: PostgreSQLContainerOptions) {
		const name = snakeCase(`postgresql_${options.resourceId}`);
		const image = {
			name: POSTGRESQL_,
			tag: options.imageTag ?? POSTGRESQL_IMAGE_TAG,
		};
		const portsToExpose = [POSTGRESQL_SERVER_PORT];
		const persistenceVolumes = [
			{
				source: path.join("/tmp", kebabCase(`${options.resourceId}-data`)),
				target: "/var/lib/postgresql/data",
			},
		];
		super({ name, image, portsToExpose, persistenceVolumes });

		if (options.connectionStringEnvVarNames) {
			this.#connectionStringEnvVarNames = options.connectionStringEnvVarNames;
		}
		this.withEnvironment({
			POSTGRES_PASSWORD: "postgres",
			POSTGRES_DB: "postgres",
		});
	}

	override async start(): Promise<StartedPostgreSQLContainer> {
		const container = new StartedPostgreSQLContainer(await super.start());
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	async startPersisted(): Promise<StartedPostgreSQLContainer> {
		this.#addDatabaseEnvVar();
		const container = new StartedPostgreSQLContainer(
			await super.startWithVolumes(),
		);
		await this.#addConnectionStringToEnvironment(container);
		return container;
	}

	#addDatabaseEnvVar() {
		this.withEnvironment({
			MP_DATABASE: "/data/database.db",
		});
	}

	async #addConnectionStringToEnvironment(
		container: StartedPostgreSQLContainer,
	) {
		for (const envVarName of this.#connectionStringEnvVarNames ?? []) {
			await updateEnvVar(envVarName, container.connectionURL);
			process.env[envVarName] = container.connectionURL;
		}
	}
}

export class StartedPostgreSQLContainer extends StartedServerContainer<StartedPostgreSQLContainer> {
	get serverPort() {
		return this.getMappedPort(POSTGRESQL_SERVER_PORT);
	}

	get connectionURL() {
		const url = new URL("", "postgres://");
		url.hostname = this.getHost();
		url.port = this.serverPort.toString();
		url.username = "postgres";
		url.password = "postgres";
		return url.toString();
	}
}
