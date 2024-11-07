import { dumpDatabaseStructureTask } from "@monorepo/programs/database/dump-database.js";
import { adminPgQuery } from "@monorepo/services/db-clients/admin-pg-query.js";
import { Effect } from "effect";
import { stat } from "node:fs/promises";
import nunjucks from "nunjucks";
import {
	afterEach,
	assert,
	beforeEach,
	describe,
	test,
	type TaskContext,
} from "vitest";
import {
	setupProgramContext,
	teardownProgramContext,
	testDatabaseName,
} from "~test-setup/program_context.js";
import { programWithContextAndServices } from "~test-setup/run-program.js";

describe("dumpDatabaseStructure", () => {
	beforeEach<TaskContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<TaskContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<TaskContext>("dumps database structure", async (context) => {
		await Effect.runPromise(
			await programWithContextAndServices(
				adminPgQuery(`CREATE DATABASE "${testDatabaseName(context)}";`),
			),
		);

		const result = await Effect.runPromise(
			await programWithContextAndServices(dumpDatabaseStructureTask),
		);

		assert(result);
		const fileStat = await stat(result);
		assert(fileStat.isFile);
	});
});

export const expectedDump = nunjucks.compile(`--
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
