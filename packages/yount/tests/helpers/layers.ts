import { Layer } from "effect";
import { dbClientsLayer } from "~/cli/services/dbClients.js";
import {
	devEnvironmentLayer,
	environmentLayer,
} from "~/cli/services/environment.js";
import { migratorLayer } from "~/cli/services/migrator.js";

export const layers = migratorLayer().pipe(
	Layer.provideMerge(dbClientsLayer()),
	Layer.provideMerge(environmentLayer("development", "default")),
	Layer.provideMerge(devEnvironmentLayer("default")),
);
