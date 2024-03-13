// eslint-disable-next-line @typescript-eslint/ban-types
export function extension(name: ContribExtension | (string & {})) {
	return new PgExtension(name);
}

export class PgExtension {
	/**
	 * @hidden
	 */
	static info(extension: PgExtension) {
		return {
			name: extension.#name,
		};
	}

	/**
	 * @hidden
	 */
	#name: string;

	/**
	 * @hidden
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	constructor(name: ContribExtension | (string & {})) {
		this.#name = name;
	}
}

type ContribExtension =
	| "adminpack"
	| "amcheck"
	| "autoinc"
	| "bloom"
	| "btree_gin"
	| "btree_gist"
	| "citext"
	| "cube"
	| "dblink"
	| "dict_int"
	| "dict_xsyn"
	| "earthdistance"
	| "file_fdw"
	| "fuzzystrmatch"
	| "hstore"
	| "insert_username"
	| "intagg"
	| "intarray"
	| "isn"
	| "lo"
	| "ltree"
	| "moddatetime"
	| "old_snapshot"
	| "pageinspect"
	| "pg_buffercache"
	| "pg_freespacemap"
	| "pg_prewarm"
	| "pg_stat_statements"
	| "pg_surgery"
	| "pg_trgm"
	| "pg_visibility"
	| "pg_walinspect"
	| "pgcrypto"
	| "pgrowlocks"
	| "pgstattuple"
	| "plpgsql"
	| "postgres_fdw"
	| "refint"
	| "seg"
	| "sslinfo"
	| "tablefunc"
	| "tcn"
	| "tsm_system_rows"
	| "tsm_system_time"
	| "unaccent"
	| "uuid-ossp"
	| "xml2";
