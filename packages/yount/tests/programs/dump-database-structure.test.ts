import { Effect } from "effect";
import { readFileSync } from "fs";
import { sql } from "kysely";
import nunjucks from "nunjucks";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dumpDatabaseStructure } from "~/programs/dump-database-structure.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
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

		await Effect.runPromise(
			Effect.provide(programWithErrorCause(dumpDatabaseStructure()), layers),
		);

		const dump = readFileSync(
			`${context.folder}/db/dumps/structure.default.sql`,
			"utf-8",
		);

		const result = await context.kysely
			.selectFrom("kysely_migration")
			.select("timestamp")
			.orderBy("timestamp")
			.executeTakeFirst();

		expect(dump).toEqual(expectedDump.render({ timestamp: result!.timestamp }));
	});

	test<ProgramContext>("dumps database structure with extensions", async (context) => {
		await context.migrator.migrateUp();

		await sql`CREATE EXTENSION moddatetime`.execute(context.kysely);
		await sql`CREATE EXTENSION btree_gin`.execute(context.kysely);

		await Effect.runPromise(
			Effect.provide(programWithErrorCause(dumpDatabaseStructure()), layers),
		);

		const dump = readFileSync(
			`${context.folder}/db/dumps/structure.default.sql`,
			"utf-8",
		);

		const result = await context.kysely
			.selectFrom("kysely_migration")
			.select("timestamp")
			.orderBy("timestamp")
			.executeTakeFirst();

		expect(dump).toEqual(
			expectedDumpWithExtensions.render({ timestamp: result!.timestamp }),
		);
	});

	test.todo<ProgramContext>(
		"dumps database structure on non default connecations",
		async () => {},
	);
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

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: kysely_migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kysely_migration (
    name character varying(255) NOT NULL,
    "timestamp" character varying(255) NOT NULL
);


--
-- Name: kysely_migration_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kysely_migration_lock (
    id character varying(255) NOT NULL,
    is_locked integer DEFAULT 0 NOT NULL
);


--
-- Name: regulus_mint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regulus_mint (
    name text NOT NULL
);


--
-- Name: kysely_migration_lock kysely_migration_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kysely_migration_lock
    ADD CONSTRAINT kysely_migration_lock_pkey PRIMARY KEY (id);


--
-- Name: kysely_migration kysely_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kysely_migration
    ADD CONSTRAINT kysely_migration_pkey PRIMARY KEY (name);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO public.kysely_migration VALUES ('20240405T120024-regulus-mint', '{{ timestamp }}');
INSERT INTO public.kysely_migration_lock VALUES ('migration_lock', 0);`);

const expectedDumpWithExtensions = nunjucks.compile(`--
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

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;


--
-- Name: EXTENSION btree_gin; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


--
-- Name: moddatetime; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA public;


--
-- Name: EXTENSION moddatetime; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION moddatetime IS 'functions for tracking last modification time';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: kysely_migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kysely_migration (
    name character varying(255) NOT NULL,
    "timestamp" character varying(255) NOT NULL
);


--
-- Name: kysely_migration_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kysely_migration_lock (
    id character varying(255) NOT NULL,
    is_locked integer DEFAULT 0 NOT NULL
);


--
-- Name: regulus_mint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regulus_mint (
    name text NOT NULL
);


--
-- Name: kysely_migration_lock kysely_migration_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kysely_migration_lock
    ADD CONSTRAINT kysely_migration_lock_pkey PRIMARY KEY (id);


--
-- Name: kysely_migration kysely_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kysely_migration
    ADD CONSTRAINT kysely_migration_pkey PRIMARY KEY (name);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO public.kysely_migration VALUES ('20240405T120024-regulus-mint', '{{ timestamp }}');
INSERT INTO public.kysely_migration_lock VALUES ('migration_lock', 0);`);