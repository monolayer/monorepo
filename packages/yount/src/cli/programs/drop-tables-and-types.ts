import { pgQuery } from "./pg-query.js";
import { spinnerTask } from "./spinner-task.js";

export function dropTablesAndTypes() {
	return spinnerTask("Drop tables and types", () =>
		pgQuery(dropAllTablesAndTypesQuery),
	);
}

const dropAllTablesAndTypesQuery = `
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

		FOR kt IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND (tablename = 'kysely_migration_lock' OR tablename = 'kysely_migration'))
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
