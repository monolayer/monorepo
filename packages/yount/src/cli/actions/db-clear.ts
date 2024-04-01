import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { pgPoolAndConfig } from "~/pg/pg-pool.js";
import { pgQueryExecuteWithResult } from "~/pg/pg-query.js";
import { importConfig } from "../../config.js";
import { ActionStatus } from "../command.js";
import { dumpStructure } from "../components/dump-structure.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function dbClear(environment: string) {
	p.intro("Clear Database");
	const s = p.spinner();
	s.start("Clearing database");
	const config = await importConfig();
	checkEnvironmentIsConfigured(config, environment, {
		spinner: s,
		outro: true,
	});

	const pool = pgPoolAndConfig(config, environment);

	const dropAllTablesAndTypes = `
		DO
		$do$
		DECLARE
				r RECORD;
				t RECORD;
				kt RECORD;
		BEGIN
				FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'kysely_migration_lock' AND tablename != 'kysely_migration')
				LOOP
						EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
				END LOOP;

				FOR kt IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
				LOOP
				  EXECUTE 'TRUNCATE TABLE public.' || quote_ident(kt.tablename);
				END LOOP;

				FOR t IN SELECT typname FROM pg_type
									LEFT JOIN pg_catalog.pg_namespace n ON n.oid = pg_type.typnamespace
									WHERE (pg_type.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = pg_type.typrelid))
										AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = pg_type.typelem AND el.typarray = pg_type.oid)
										AND n.nspname = 'public'
									ORDER BY pg_type.typname
				LOOP
						EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(t.typname) || ' CASCADE';
				END LOOP;

		END
		$do$;
	`;
	const dropTablesAndTypes = await pgQueryExecuteWithResult<{
		datname: string;
	}>(pool.pool, dropAllTablesAndTypes);
	if (dropTablesAndTypes.status === ActionStatus.Error) {
		s.stop(dropTablesAndTypes.error.message, 1);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}

	s.stop(`${color.green("cleared")} ${pool.config.database}`);

	try {
		s.start("Dumping database structure");

		const result = await dumpStructure(config, environment);
		if (result instanceof Error) {
			p.log.error(`${color.red("error")} while dumping structure`);
			console.error(result);
			process.exit(1);
		}

		s.stop(`${color.green("dumped")} ${result}`);
	} catch (error) {
		console.dir(error);
		exit(1);
	}

	p.outro("Done");
}
