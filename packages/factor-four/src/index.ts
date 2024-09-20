export { Container, type ContainerOptions } from "@monorepo/resources/index.js";

export {
	StartedServerContainer,
	StartedServerContainerWithWebUI,
} from "@monorepo/resources/index.js";

export { type PostgreSQLContainer } from "@monorepo/resources/index.js";

export {
	definePostgreSQLDatabase,
	type PostgreSQLDatabase,
} from "@monorepo/resources/index.js";

export {
	type MemcachedContainer,
	type MemcachedContainerOptions,
	type StartedMemcachedContainer,
} from "@monorepo/resources/index.js";

export {
	defineMemcachedStore,
	type MemcachedStore,
} from "@monorepo/resources/index.js";

export {
	type RedisContainer,
	type RedisContainerOptions,
	type StartedRedisContainer,
} from "@monorepo/resources/index.js";

export {
	defineRedisStore,
	type RedisStore,
} from "@monorepo/resources/index.js";

export {
	type SESContainer,
	type SESContainerOptions,
	type StartedSESContainer,
} from "@monorepo/resources/index.js";

export { defineSESMailer, type SESMailer } from "@monorepo/resources/index.js";

export {
	type SMTPContainer,
	type SMTPContainerOptions,
	type StartedSMTPContainer,
} from "@monorepo/resources/index.js";

export {
	defineSMTPMailer,
	type SMTPMailer,
} from "@monorepo/resources/index.js";

export {
	importResources,
	startResources,
	stopResources,
} from "@monorepo/resources/index.js";
