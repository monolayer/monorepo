import type { AppEnvironment } from "@monorepo/state/app-environment.js";
import type { DbClients } from "~/db-clients.js";
import type { Migrator } from "./migrator.js";

export type ProgramContext = Migrator | DbClients | AppEnvironment;
