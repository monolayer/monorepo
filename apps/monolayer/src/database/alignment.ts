import { Effect } from "effect";
import { adminPgQuery } from "~/services/db-clients.js";
import type { ColumnInfo } from "./schema/table/column/types.js";

export interface ColumnToAlign extends ColumnInfo {
	alignment: TypeAlignment | undefined;
}

export interface TypeAlignment {
	typname: string;
	typalign: string;
	typlen: number;
	sortCriteria: number;
	typalignBytes: number;
}

interface TypeAlignmentQuery {
	json_agg: TypeAlignment[];
}

export const introspectAlignment = Effect.gen(function* () {
	const queryResult = yield* adminPgQuery<TypeAlignmentQuery>(query);
	const typeAlignments = queryResult[0]!.json_agg;
	return typeAlignments;
});

export function alignColumns(
	columns: ColumnInfo[],
	typeAlignments: TypeAlignment[],
) {
	const columnsToAlign: ColumnToAlign[] = columns.map((column) => {
		return {
			...column,
			alignment: column.enum
				? {
						typname: column.dataType,
						typalign: "i",
						typlen: 4,
						sortCriteria: 4,
						typalignBytes: 4,
					}
				: typeAlignments.find((type) => type.typname === column.dataType),
		};
	});
	return columnsToAlign.sort(alignment);
}

const alignment = (a: ColumnToAlign, b: ColumnToAlign) => {
	const aType = a.alignment;
	const bType = b.alignment;

	if (aType === undefined || bType === undefined) {
		if (aType === undefined && bType !== undefined) return 1;
		if (aType !== undefined && bType === undefined) return -1;
		if (aType === undefined && bType === undefined) {
			if (a.isNullable === b.isNullable) {
				return a.columnName!.localeCompare(b.columnName!);
			}
			return a.isNullable ? 1 : -1;
		}
		return 0;
	}

	if (aType.sortCriteria === bType.sortCriteria) {
		if (aType.typalignBytes !== bType.typalignBytes) {
			return bType.typalignBytes - aType.typalignBytes;
		}
		if (a.isNullable === b.isNullable) {
			return a.columnName!.localeCompare(b.columnName!);
		}
		return a.isNullable ? 1 : -1;
	} else {
		return bType.sortCriteria - aType.sortCriteria;
	}
};

const query = `
WITH type_info AS (
  SELECT typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname NOT LIKE '\\_%' ESCAPE '\\'
  UNION ALL
  SELECT 'boolean' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'bool'
  UNION ALL
  SELECT 'bigint' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int8'
  UNION ALL
  SELECT 'bigserial' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int8'
  UNION ALL
  SELECT 'bit varying' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'varbit'
  UNION ALL
  SELECT 'character' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'char'
  UNION ALL
  SELECT 'double precision' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'float8'
  UNION ALL
  SELECT 'character varying' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'varchar'
  UNION ALL
  SELECT 'integer' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int4'
  UNION ALL
  SELECT 'serial' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int4'
  UNION ALL
  SELECT 'serial4' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int4'
  UNION ALL
  SELECT 'serial8' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int8'
  UNION ALL
  SELECT 'real' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'float4'
  UNION ALL
  SELECT 'smallint' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int2'
  UNION ALL
  SELECT 'smallserial' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int2'
  UNION ALL
  SELECT 'serial2' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'int2'
  UNION ALL
  SELECT 'time without time zone' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'time'
  UNION ALL
  SELECT 'time with time zone' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'timetz'
  UNION ALL
  SELECT 'timestamp without time zone' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'timestamp'
  UNION ALL
  SELECT 'timestamp with time zone' AS typname, typalign, typlen
  FROM pg_catalog.pg_type
  WHERE typname = 'timestamptz'
)
SELECT json_agg(row_to_json(t))
FROM (
  SELECT typname, typalign, typlen,
    CASE
      WHEN typalign = 'c' AND typlen <> -1 THEN 1
      WHEN typalign = 'c' AND typlen = -1 THEN -1
      WHEN typalign = 's' AND typlen <> -1 THEN 2
      WHEN typalign = 's' AND typlen = -1 THEN -1
      WHEN typalign = 'i' AND typlen <> -1 THEN 4
      WHEN typalign = 'i' AND typlen = -1 THEN -1
      WHEN typalign = 'd' AND typlen <> -1 THEN 8
      WHEN typalign = 'd' AND typlen = -1 THEN -1
      ELSE -1
    END AS "sortCriteria",
    CASE
      WHEN typalign = 'c' THEN 1
      WHEN typalign = 's' THEN 2
      WHEN typalign = 'i' THEN 4
      WHEN typalign = 'd' THEN 8
      ELSE -1
    END AS "typalignBytes"
  FROM type_info
  ORDER BY typname
) t;
`;
