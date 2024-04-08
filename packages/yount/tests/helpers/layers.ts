import { Layer } from "effect";
import {
	devEnvironmentLayer,
	environmentLayer,
} from "~/cli/services/environment.js";
import { kyselyLayer } from "~/cli/services/kysely.js";
import { migratorLayer } from "~/cli/services/migrator.js";
import { pgLayer } from "~/cli/services/pg.js";

export const layers = migratorLayer().pipe(
	Layer.provideMerge(kyselyLayer()),
	Layer.provideMerge(pgLayer()),
	Layer.provideMerge(environmentLayer("development")),
	Layer.provideMerge(devEnvironmentLayer()),
);
