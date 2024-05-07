import { Effect, Ref } from "effect";
import { readFileSync } from "fs";
import { sql } from "kysely";
import nunjucks from "nunjucks";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { loadEnv } from "~/cli/cli-action.js";
import { dumpDatabaseStructureTask } from "~/database/dump.js";
import { AppEnvironment } from "~/state/app-environment.js";
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
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(dumpDatabaseStructureTask()),
					layers,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
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
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(dumpDatabaseStructureTask()),
					layers,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
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

		console.log(dump);
		expect(dump).toEqual(
			expectedDumpWithExtensions.render({ timestamp: result!.timestamp }),
		);
	});

	test.todo<ProgramContext>(
		"dumps database structure on non default connecations",
		async () => {},
	);
});

const expectedDump = nunjucks.compile(`-- Settings

SET check_function_bodies = on;
SET client_encoding = 'UTF8';
SET client_min_messages = notice;
SET idle_in_transaction_session_timeout = 0;
SET lock_timeout = 0;
SET row_security = on;
SET search_path = "$user", public;
SET standard_conforming_strings = on;
SET statement_timeout = 0;
SET xmloption = content;

-- Extensions

-- Functions

-- Schemas

-- public schema

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE public.kysely_migration (
 name character varying(255) NOT NULL,
 timestamp character varying(255) NOT NULL
) TABLESPACE pg_default;
ALTER TABLE ONLY public.kysely_migration ADD CONSTRAINT kysely_migration_pkey PRIMARY KEY (name);

CREATE TABLE public.kysely_migration_lock (
 id character varying(255) NOT NULL,
 is_locked integer NOT NULL DEFAULT 0
) TABLESPACE pg_default;
ALTER TABLE ONLY public.kysely_migration_lock ADD CONSTRAINT kysely_migration_lock_pkey PRIMARY KEY (id);

CREATE TABLE public.regulus_mint (
 name text NOT NULL
) TABLESPACE pg_default;


-- Migration Data

INSERT INTO public.kysely_migration VALUES ('20240405T120024-regulus-mint', '{{ timestamp }}');
INSERT INTO public.kysely_migration_lock VALUES ('migration_lock', 0);`);

const expectedDumpWithExtensions = nunjucks.compile(`-- Settings

SET check_function_bodies = on;
SET client_encoding = 'UTF8';
SET client_min_messages = notice;
SET idle_in_transaction_session_timeout = 0;
SET lock_timeout = 0;
SET row_security = on;
SET search_path = "$user", public;
SET standard_conforming_strings = on;
SET statement_timeout = 0;
SET xmloption = content;

-- Extensions

CREATE EXTENSION IF NOT EXISTS "moddatetime";

CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Functions

-- Schemas

-- public schema

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE public.kysely_migration (
 name character varying(255) NOT NULL,
 timestamp character varying(255) NOT NULL
) TABLESPACE pg_default;
ALTER TABLE ONLY public.kysely_migration ADD CONSTRAINT kysely_migration_pkey PRIMARY KEY (name);

CREATE TABLE public.kysely_migration_lock (
 id character varying(255) NOT NULL,
 is_locked integer NOT NULL DEFAULT 0
) TABLESPACE pg_default;
ALTER TABLE ONLY public.kysely_migration_lock ADD CONSTRAINT kysely_migration_lock_pkey PRIMARY KEY (id);

CREATE TABLE public.regulus_mint (
 name text NOT NULL
) TABLESPACE pg_default;


-- Migration Data

INSERT INTO public.kysely_migration VALUES ('20240405T120024-regulus-mint', '{{ timestamp }}');
INSERT INTO public.kysely_migration_lock VALUES ('migration_lock', 0);`);
