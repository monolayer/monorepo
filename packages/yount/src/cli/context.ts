import type { DbClients } from "./services/dbClients.js";
import type { DevEnvironment, Environment } from "./services/environment.js";
import type { Db, DevDb } from "./services/kysely.js";
import type { Migrator } from "./services/migrator.js";
import type { DevPg, Pg } from "./services/pg.js";

export type Context =
	| Environment
	| DevEnvironment
	| Db
	| DevDb
	| Migrator
	| Pg
	| DevPg
	| DbClients;
