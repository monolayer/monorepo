import { sql, type Kysely } from "kysely";
import { Schema, type AnySchema } from "~/schema/schema.js";
import type { InformationSchemaDB } from "../../../introspection/types.js";
import { EnumType } from "./enum.js";

export async function dbEnumInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
) {
	const results = await kysely
		.selectFrom("pg_type")
		.innerJoin("pg_enum", (join) =>
			join.onRef("pg_enum.enumtypid", "=", "pg_type.oid"),
		)
		.innerJoin("pg_namespace", (join) =>
			join
				.onRef("pg_namespace.oid", "=", "pg_type.typnamespace")
				.on("pg_namespace.nspname", "=", databaseSchema),
		)
		.leftJoin("pg_description", (join) =>
			join
				.onRef("pg_description.objoid", "=", "pg_type.oid")
				.on("pg_description.objsubid", "=", 0),
		)
		.select([
			"pg_type.typname as enum_name",
			sql<string[]>`json_agg(pg_enum.enumlabel)`.as("enum_values"),
		])
		.where("pg_namespace.nspname", "=", databaseSchema)
		.where("pg_type.typtype", "=", "e")
		.where("pg_description.description", "=", "yount")
		.groupBy("pg_type.typname")
		.groupBy("pg_namespace.nspname")
		.orderBy("pg_type.typname")
		.execute();

	const enumInfo = results.reduce<EnumInfo>((acc, curr) => {
		acc[curr.enum_name] = curr.enum_values.sort().join(", ");
		return acc;
	}, {});

	return enumInfo;
}

export function localEnumInfo(schema: AnySchema) {
	const types = Schema.info(schema).types;
	return types.reduce<EnumInfo>((acc, type) => {
		if (isExternalEnum(type)) {
			return acc;
		}
		acc[type.name] = type.values.join(", ");
		return acc;
	}, {});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isExternalEnum(enumType: EnumType<any>): boolean {
	assertEnumWithInfo(enumType);
	return enumType.isExternal;
}

export type EnumInfo = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertEnumWithInfo<T extends EnumType<any>>(
	val: T,
): asserts val is T & {
	isExternal: boolean;
} {
	true;
}
