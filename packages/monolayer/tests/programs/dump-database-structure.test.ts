import { readFileSync } from "fs";
import nunjucks from "nunjucks";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dumpDatabaseStructureTask } from "~/database/dump.js";
import { runProgramWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("dumpDatabaseStructure", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("dumps database structure", async (context) => {
		await context.migrator.migrateUp();

		await runProgramWithErrorCause(dumpDatabaseStructureTask);

		const dump = readFileSync(
			`${context.folder}/monolayer/dumps/structure.default.sql`,
			"utf-8",
		);

		const result = await context.kysely
			.selectFrom("monolayer_alter_migration")
			.select("timestamp")
			.orderBy("timestamp")
			.executeTakeFirst();

		expect(dump).toEqual(expectedDump.render({ timestamp: result!.timestamp }));
	});
});

const expectedDump = nunjucks.compile(`--
-- PostgreSQL database dump
--


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS "public";


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: monolayer_alter_migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."monolayer_alter_migration" (
    "name" character varying(255) NOT NULL,
    "timestamp" character varying(255) NOT NULL
);


--
-- Name: monolayer_alter_migration_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."monolayer_alter_migration_lock" (
    "id" character varying(255) NOT NULL,
    "is_locked" integer DEFAULT 0 NOT NULL
);


--
-- Name: regulus_mint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."regulus_mint" (
    "name" "text" NOT NULL
);


--
-- Name: monolayer_alter_migration_lock monolayer_alter_migration_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."monolayer_alter_migration_lock"
    ADD CONSTRAINT "monolayer_alter_migration_lock_pkey" PRIMARY KEY ("id");


--
-- Name: monolayer_alter_migration monolayer_alter_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."monolayer_alter_migration"
    ADD CONSTRAINT "monolayer_alter_migration_pkey" PRIMARY KEY ("name");


--
-- PostgreSQL database dump complete
--

INSERT INTO "public"."monolayer_alter_migration" VALUES ('20240405T120024-regulus-mint', '{{ timestamp }}');
INSERT INTO "public"."monolayer_alter_migration_lock" VALUES ('migration_lock', 0);`);
