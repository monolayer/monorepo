import type { DbClients } from "./services/db-clients.js";
import type { DevEnvironment, Environment } from "./services/environment.js";
import type { Migrator } from "./services/migrator.js";

export type ProgramContext =
	| Environment
	| DevEnvironment
	| Migrator
	| DbClients;
