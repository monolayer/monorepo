CREATE PROCEDURE backfill_procedure(batch_size INT)
LANGUAGE plpgsql
AS $$
DECLARE
    rows INT := 1;
    last_id INT := 0;
BEGIN
    WHILE Rows > 0 LOOP
        WITH cte AS (
            SELECT "id", "name"
                FROM public."Account"
                WHERE "id" > last_id
                ORDER BY "id"
                LIMIT batch_size
        )
        UPDATE public."Account"
            SET "id" = cte.id
            FROM cte
            WHERE "Account"."id" = cte.id;
        GET DIAGNOSTICS rows = ROW_COUNT;
        COMMIT;
        last_id := last_id + rows;
    END LOOP;
END;
$$;


CREATE PROCEDURE backfill_procedure(batch_size INT)
LANGUAGE plpgsql
AS $$
DECLARE
    rows INT := 1;
    last_id TEXT := '';
BEGIN
    WHILE Rows > 0 LOOP
        WITH cte AS (
            SELECT "id", "name"
                FROM public."Account"
                WHERE "id" > last_id
                ORDER BY "id"
                LIMIT batch_size
        )
        UPDATE public."Account"
            SET "id" = cte.id
            FROM cte
            WHERE "Account"."id" = cte.id;
        GET DIAGNOSTICS rows = ROW_COUNT;
        COMMIT;
        WITH batch AS (
            SELECT "id"
            FROM public."Account"
            WHERE "id" > last_id
            ORDER BY "id"
            LIMIT batch_size
		    )
		      SELECT (SELECT MAX("id") FROM batch) INTO last_id;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_{{ hash }}() RETURNS TRIGGER AS $$
DECLARE
    split_values JSONB;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF (
            NEW."firstName" IS DISTINCT FROM OLD."firstName" OR NEW."lastName" IS DISTINCT FROM OLD."lastName"
            ) THEN
            NEW."name" := combine(jsonb_build_object('firstName', NEW."firstName", 'lastName', NEW."lastName"));
        ELSE
            split_values := split(NEW."name");
            NEW."firstName" = split_values->>'firstName';
            NEW."lastName" = split_values->>'lastName';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION combine(first_name TEXT, last_name TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN first_name || ' ' || last_name;
END;
$$ LANGUAGE plpgsql;

-- Create the split function
CREATE OR REPLACE FUNCTION split(name TEXT) RETURNS TEXT[] AS $$
DECLARE
    result TEXT[];
BEGIN
    result := string_to_array(name, ' ');
    RETURN result;
END;
$$ LANGUAGE plpgsql;
