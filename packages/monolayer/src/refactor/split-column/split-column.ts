import { sql } from "kysely";
import nunjucks from "nunjucks";

export function splitColumnBackfill(opts: {
	hash: string;
	schema: string;
	tableName: string;
	primaryKeyColumn: string;
	sourceColumn: string;
	targetColumns: string[];
}) {
	return sql`${sql.raw(backFillProcedure.render(opts))}`;
}

const backFillProcedure =
	nunjucks.compile(`CREATE PROCEDURE backfill_proc_temp_{{ hash }}(batch_size INT)
LANGUAGE plpgsql
AS $$
DECLARE
    rows INT := 1;
    last_id INT := 0;
BEGIN
    WHILE Rows > 0 LOOP
        WITH cte AS (
            SELECT {{ primaryKeyColumn }}, {{ sourceColumn }}
                FROM {{ schema }}.{{ tableName }}
                WHERE {{ primaryKeyColumn }} > last_id
                ORDER BY {{ primaryKeyColumn }}
                LIMIT batch_size
        )
        UPDATE {{ schema }}.{{ tableName }}
            SET {{ primaryKeyColumn }} = cte.{{ primaryKeyColumn }}
            FROM cte
            WHERE {{ tableName }}.{{ primaryKeyColumn }} = cte.{{ primaryKeyColumn }};
        GET DIAGNOSTICS rows = ROW_COUNT;
        COMMIT;
        last_id := last_id + rows;
    END LOOP;
END;
$$;
`);

export function splitColumnSyncTrigger(opts: {
	hash: string;
	schema: string;
	sourceColumn: string;
	targetColumns: string[];
}) {
	return sql`${sql.raw(syncFunction.render(opts))}`;
}

const syncFunction = nunjucks.compile(`
  CREATE OR REPLACE FUNCTION {{ schema }}.sync{{ hash }}() RETURNS TRIGGER AS $$
  DECLARE
      split_values JSONB;
  BEGIN
      IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
          IF (
          {%- for column in targetColumns %}
              NEW."{{ column }}" IS DISTINCT FROM OLD."{{ column }}"{% if not loop.last %} OR{% endif %}
          {%- endfor %}
             ) THEN
              NEW."{{ sourceColumn }}" := combine{{ hash }}(jsonb_build_object({%- for column in targetColumns %}'{{ column }}', NEW."{{ column }}"{% if not loop.last %},{% endif %}{%- endfor %}));
          ELSE
              IF (NEW."{{ sourceColumn }}" IS DISTINCT FROM OLD."{{ sourceColumn }}" OR ({%- for column in targetColumns %}NEW."{{ column }}" IS NULL{% if not loop.last %} AND {% endif %}{%- endfor %})) THEN
                  split_values := split{{ hash }}(NEW."{{ sourceColumn }}");
                  {%- for column in targetColumns %}
                  NEW."{{ column }}" = split_values->>'{{ column }}';
                  {%- endfor %}
              END IF;
          END IF;
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;`);

export const splitColumnExpandMigration =
	nunjucks.compile(`/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration, splitColumnBackfill, splitColumnSyncTrigger, createOrReplaceFunction } from "monolayer/migration";

export const migration: Migration = {
    name: "{{ name }}",
    transaction: true,
    scaffold: false,
    warnings: [],
};

export async function up(db: Kysely<any>): Promise<void> {

  await sql\`CREATE EXTENSION IF NOT EXISTS plv8;\`.execute(db);

  await (
    createOrReplaceFunction({
      schema: "{{ schema }}",
      name: "split{{ hash }}",
      fn: split{{ hash }},
      dataIn: "text",
      dataOut: "JSONB",
    })
  ).execute(db);

  await (
    createOrReplaceFunction({
      schema: "{{ schema }}",
      name: "combine{{ hash }}",
      fn: combine{{ hash }},
      dataIn: "JSONB",
      dataOut: "text",
    })
  ).execute(db);

  await splitColumnSyncTrigger({
    hash: "{{ hash }}",
    schema: "{{ schema}}",
    sourceColumn: "{{ sourceColumn }}",
    targetColumns: [{% for column in targetColumns %}"{{ column }}"{% if not loop.last %}, {% endif %}{% endfor %}],
  }).execute(db);

  await splitColumnBackfill({
    hash: "{{ hash }}",
    schema: "{{ schema}}",
    tableName: "{{ tableName }}",
    primaryKeyColumn: "id",
    sourceColumn: "{{ sourceColumn }}",
    targetColumns: [{% for column in targetColumns %}"{{ column }}"{% if not loop.last %}, {% endif %}{% endfor %}],
  }).execute(db);

  await sql\`CREATE TRIGGER sync_columns{{ hash }}
BEFORE INSERT OR UPDATE ON {{ schema }}."{{ tableName }}"
FOR EACH ROW
EXECUTE FUNCTION sync{{ hash }}();
  \`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.split{{ hash }};\`.execute(db);
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.combine{{ hash }};\`.execute(db);
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.backfill{{ hash }};\`.execute(db);
  await sql\`DROP TRIGGER IF EXISTS sync_columns{{ hash }} ON {{ schema }}."{{ tableName }}";\`.execute(db);
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.sync{{ hash }};\`.execute(db);
}

export function split{{ hash }}(value: {{ columnType }}): {
{%- for column in targetColumns %}
  {{ column }}: string;
{%- endfor %}
} {
  return {
{%- for column in targetColumns %}
    {{ column }}: "",
{%- endfor %}
	};
}

export function combine{{ hash }}(data: {
{%- for column in targetColumns %}
  {{ column }}: string;
{%- endfor %}
}): string {
  return "";
}
`);

export const splitColumnDataMigration =
	nunjucks.compile(`/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
    name: "{{ name }}",
    transaction: false,
    scaffold: false,
    warnings: [],
};

export async function up(db: Kysely<any>): Promise<void> {
  await sql\`CALL backfill_proc_temp_{{ hash }}({{ batchSize }});\`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {}
`);

export const splitColumnContractMigration =
	nunjucks.compile(`/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
    name: "{{ name }}",
    transaction: true,
    scaffold: false,
    warnings: [],
};

export async function up(db: Kysely<any>): Promise<void> {
  await sql\`DROP PROCEDURE IF EXISTS backfill_proc_temp_{{ hash }}(batch_size integer);\`.execute(
    db
  );
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.split{{ hash }};\`.execute(db);
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.combine{{ hash }};\`.execute(db);
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.backfill{{ hash }};\`.execute(db);
  await sql\`DROP TRIGGER IF EXISTS sync_columns{{ hash }} ON {{ schema }}."{{ tableName }}";\`.execute(db);
  await sql\`DROP FUNCTION IF EXISTS {{ schema }}.sync{{ hash }};\`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {}
`);
