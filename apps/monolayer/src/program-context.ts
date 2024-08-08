import type { DbClients } from "./services/db-clients.js";
import type { Migrator } from "./services/migrator.js";
import type { AppEnvironment } from "./state/app-environment.js";

export type ProgramContext = Migrator | DbClients | AppEnvironment;
