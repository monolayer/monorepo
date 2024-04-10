import { Layer } from "effect";
import {
	devEnvironmentLayer,
	environmentLayer,
} from "~/cli/services/environment.js";
import { devKyselyLayer, kyselyLayer } from "~/cli/services/kysely.js";
import { migratorLayer } from "~/cli/services/migrator.js";
import { devPgLayer, pgLayer } from "~/cli/services/pg.js";

export const layers = migratorLayer().pipe(
	Layer.provideMerge(kyselyLayer()),
	Layer.provideMerge(devKyselyLayer()),
	Layer.provideMerge(pgLayer()),
	Layer.provideMerge(devPgLayer()),
	Layer.provideMerge(environmentLayer("development", "default")),
	Layer.provideMerge(devEnvironmentLayer("default")),
);
