import { Layer } from "effect";
import { environmentLayer } from "~/cli/services/environment.js";
import { kyselyLayer } from "~/cli/services/kysely.js";
import { migratorLayer } from "~/cli/services/migrator.js";

export const layers = migratorLayer().pipe(
	Layer.provideMerge(kyselyLayer()),
	Layer.provideMerge(environmentLayer("development")),
);
