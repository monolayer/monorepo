import type { AppEnvironment } from "@monorepo/state/app-environment.js";
import type { DbClients } from "~services/db-clients.js";
import type { Migrator } from "~services/migrator.js";

export type ProgramContext = Migrator | DbClients | AppEnvironment;
