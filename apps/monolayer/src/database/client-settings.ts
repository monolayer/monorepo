import { sql, type Kysely } from "kysely";
import type { InformationSchemaDB } from "~/introspection/types.js";

export async function databaseClientSettings(db: Kysely<InformationSchemaDB>) {
	const results = await db
		.selectFrom("pg_settings")
		.select((eb) =>
			eb
				.case()
				.when("name", "=", "client_encoding")
				.then(sql<string>`'SET ' || name || ' = ''' || setting || ''';'`)
				.else(sql<string>`'SET ' || name || ' = ' || setting || ';'`)
				.end()
				.as("settings"),
		)
		.where("name", "in", settings)
		.execute();
	return results;
}

const settings = [
	"statement_timeout",
	"lock_timeout",
	"idle_in_transaction_session_timeout",
	"client_encoding",
	"standard_conforming_strings",
	"check_function_bodies",
	"xmloption",
	"client_min_messages",
	"row_security",
	"search_path",
];
