import type { DbClients } from "./services/dbClients.js";
import type { DevEnvironment, Environment } from "./services/environment.js";
import type { Migrator } from "./services/migrator.js";

export type Context = Environment | DevEnvironment | Migrator | DbClients;
