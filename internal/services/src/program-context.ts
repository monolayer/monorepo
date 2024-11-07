import type { AppEnvironment } from "@monorepo/state/app-environment.js";
import type { DbClients } from "~services/db-clients.js";

export type ProgramContext = DbClients | AppEnvironment;
