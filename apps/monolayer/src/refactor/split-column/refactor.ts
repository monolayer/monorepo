import { sql } from "kysely";
import nunjucks from "nunjucks";
import { hashValue } from "../../utils.js";
import { Refactor } from "../refactor.js";

interface SplitColumnRefactoringOptions {
	schema: string;
	tableName: string;
	primaryKeyColumn: string;
	primaryKeyColumnType: "integer" | "text";
	sourceColumn: string;
	targetColumns: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (value: any) => any;

export class SplitColumnRefactor extends Refactor {
	#splitFn?: AnyFunction;
	#combineFn?: AnyFunction;

	constructor(public options: SplitColumnRefactoringOptions) {
		super();
	}

	prepare() {
		if (this.#splitFn === undefined)
			throw new Error("Split function not defined");
		if (this.#combineFn === undefined)
			throw new Error("Combine function not defined");

		const statements = [
			"CREATE EXTENSION IF NOT EXISTS plv8;",
			this.#backfillFn,
			this.#splitColumnSyncTrigger,
			plv8Fn.render(this.#optionsForSplitFn),
			plv8Fn.render(this.#optionsForCombineFn),
			this.#trigger,
		].join("\n");
		return sql`${sql.raw(statements)}`;
	}

	perform() {
		return sql`${sql.raw(this.#perform)}`;
	}

	down() {
		return sql`${sql.raw(splitColumnContractMigration.render(this.#optionsWithHash))}`;
	}

	splitFn(value: AnyFunction) {
		this.#splitFn = value;
		return this;
	}

	combineFn(value: AnyFunction) {
		this.#combineFn = value;
		return this;
	}

	get #hash() {
		return hashValue(Object.values(this.options).sort().join("-"));
	}

	get #backfillFn() {
		switch (this.options.primaryKeyColumnType) {
			case "integer":
				return backFillProcedureInteger.render(this.#optionsWithHash);
			case "text":
				return backFillProcedureText.render(this.#optionsWithHash);
		}
	}

	get #splitColumnSyncTrigger() {
		return syncFunction.render(this.#optionsWithHash);
	}
	get #optionsWithHash() {
		return { ...this.options, hash: this.#hash };
	}

	get #trigger() {
		return `CREATE TRIGGER sync_columns_${this.#hash}
BEFORE INSERT OR UPDATE ON ${this.options.schema}."${this.options.tableName}"
FOR EACH ROW
EXECUTE FUNCTION sync_${this.#hash}();`;
	}

	get #perform() {
		return `CALL backfill_proc_temp_${this.#hash}(10000);`;
	}

	get #optionsForSplitFn() {
		return {
			schema: this.options.schema,
			name: `split_${this.#hash}`,
			fn: this.#splitFn!,
			dataIn: "text" as const,
			dataOut: "JSONB" as const,
		};
	}

	get #optionsForCombineFn() {
		return {
			schema: this.options.schema,
			name: `combine_${this.#hash}`,
			fn: this.#combineFn!,
			dataIn: "JSONB" as const,
			dataOut: "text" as const,
		};
	}
}

const backFillProcedureInteger =
	nunjucks.compile(`CREATE PROCEDURE backfill_proc_temp_{{ hash }}(batch_size INT)
LANGUAGE plpgsql
AS $$
DECLARE
    rows INT := 1;
    last_id INT := 0;
BEGIN
    WHILE Rows > 0 LOOP
        WITH cte AS (
            SELECT "{{ primaryKeyColumn }}", "{{ sourceColumn }}"
                FROM {{ schema }}."{{ tableName }}"
                WHERE "{{ primaryKeyColumn }}" > last_id
                ORDER BY "{{ primaryKeyColumn }}"
                LIMIT batch_size
        )
        UPDATE {{ schema }}."{{ tableName }}"
            SET "{{ primaryKeyColumn }}" = cte.{{ primaryKeyColumn }}
            FROM cte
            WHERE "{{ tableName }}"."{{ primaryKeyColumn }}" = cte.{{ primaryKeyColumn }};
        GET DIAGNOSTICS rows = ROW_COUNT;
        COMMIT;
        last_id := last_id + rows;
    END LOOP;
END;
$$;
`);

const backFillProcedureText =
	nunjucks.compile(`CREATE PROCEDURE backfill_proc_temp_{{ hash }}(batch_size INT)
LANGUAGE plpgsql
AS $$
DECLARE
    rows INT := 1;
    last_id TEXT := '';
BEGIN
    WHILE Rows > 0 LOOP
        WITH cte AS (
            SELECT "{{ primaryKeyColumn }}", "{{ sourceColumn }}"
                FROM {{ schema }}."{{ tableName }}"
                WHERE "{{ primaryKeyColumn }}" > last_id
                ORDER BY "{{ primaryKeyColumn }}"
                LIMIT batch_size
        )
        UPDATE {{ schema }}."{{ tableName }}"
            SET "{{ primaryKeyColumn }}" = cte.{{ primaryKeyColumn }}
            FROM cte
            WHERE "{{ tableName }}"."{{ primaryKeyColumn }}" = cte.{{ primaryKeyColumn }};
        GET DIAGNOSTICS rows = ROW_COUNT;
        COMMIT;
        WITH batch AS (
            SELECT "{{ primaryKeyColumn }}"
            FROM public."{{ tableName }}"
            WHERE "{{ primaryKeyColumn }}" > last_id
            ORDER BY "{{ primaryKeyColumn }}"
            LIMIT batch_size
		    )
		      SELECT (SELECT MAX("id") FROM batch) INTO last_id;
    END LOOP;
END;
$$;
`);

const syncFunction =
	nunjucks.compile(`CREATE OR REPLACE FUNCTION {{ schema }}.sync_{{ hash }}() RETURNS TRIGGER AS $$
DECLARE
    split_values JSONB;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF (
        {%- for column in targetColumns %}
            NEW."{{ column }}" IS DISTINCT FROM OLD."{{ column }}"{% if not loop.last %} OR{% endif %}
        {%- endfor %}
            ) THEN
            NEW."{{ sourceColumn }}" := combine_{{ hash }}(jsonb_build_object({%- for column in targetColumns %}'{{ column }}', NEW."{{ column }}"{% if not loop.last %},{% endif %}{%- endfor %}));
        ELSE
            split_values := split_{{ hash }}(NEW."{{ sourceColumn }}");
            {%- for column in targetColumns %}
            NEW."{{ column }}" = split_values->>'{{ column }}';
            {%- endfor %}
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`);

const splitColumnContractMigration = nunjucks.compile(`
DROP PROCEDURE IF EXISTS backfill_proc_temp_{{ hash }}(batch_size integer);
DROP FUNCTION IF EXISTS {{ schema }}.split_{{ hash }};
DROP FUNCTION IF EXISTS {{ schema }}.combine_{{ hash }};
DROP FUNCTION IF EXISTS {{ schema }}.backfill{{ hash }};
DROP TRIGGER IF EXISTS sync_columns_{{ hash }} ON {{ schema }}."{{ tableName }}";
DROP FUNCTION IF EXISTS {{ schema }}.sync_{{ hash }};
`);

const plv8Fn =
	nunjucks.compile(`CREATE OR REPLACE FUNCTION {{ schema }}.{{ name }}(value {{ dataIn }}) RETURNS {{ dataOut }} AS $$
let {{ name }} = {{ fn | safe }}

return {{ name }}(value)

$$ LANGUAGE plv8 IMMUTABLE STRICT;`);
