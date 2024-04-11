import type { Kysely } from "kysely";
import { PgExtension } from "~/schema/extension/extension.js";
import type { InformationSchemaDB } from "../../introspection/types.js";

export async function dbExtensionInfo(kysely: Kysely<InformationSchemaDB>) {
	const results = await kysely
		.selectFrom("pg_extension")
		.leftJoin("pg_namespace", "pg_extension.extnamespace", "pg_namespace.oid")
		.select(["extname"])
		.where("extname", "!=", "plpgsql")
		.execute();

	const extensionInfo = results.reduce<ExtensionInfo>((acc, curr) => {
		acc[curr.extname] = true;
		return acc;
	}, {});

	return extensionInfo;
}

export function localExtensionInfo(extensions?: PgExtension[]) {
	return (extensions || []).reduce<ExtensionInfo>((acc, curr) => {
		const name = PgExtension.info(curr).name;
		acc[name] = true;
		return acc;
	}, {});
}

export type ExtensionInfo = Record<string, boolean>;
