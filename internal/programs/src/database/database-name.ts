import { DbClients } from "@monorepo/services/db-clients.js";
import { map } from "effect/Effect";

export const databaseName = DbClients.pipe(map((db) => db.databaseName));
