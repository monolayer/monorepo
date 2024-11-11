import { structureLoad } from "@monorepo/programs/database/structure-load.js";
import { Effect } from "effect";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, test, type TaskContext } from "vitest";
import {
	programFolder,
	setupProgramContext,
	teardownProgramContext,
} from "~test-setup/program_context.js";
import { programWithContextAndServices } from "~test-setup/run-program.js";

beforeEach<TaskContext>(async (context) => {
	await setupProgramContext(context);
});

afterEach<TaskContext>(async (context) => {
	await teardownProgramContext(context);
});

test<TaskContext>("restores db from structure file", async (context) => {
	mkdirSync(path.join(programFolder(context), "monolayer", "dumps"), {
		recursive: true,
	});
	writeFileSync(
		path.join(
			programFolder(context),
			"monolayer",
			"dumps",
			"structure.default.sql",
		),
		structure,
	);

	await Effect.runPromise(await programWithContextAndServices(structureLoad));
});

const structure = `
-- PostgreSQL database dump
--
SET
  statement_timeout = 0;

SET
  lock_timeout = 0;

SET
  idle_in_transaction_session_timeout = 0;

SET
  client_encoding = 'UTF8';

SET
  standard_conforming_strings = on;

SELECT
  pg_catalog.set_config('search_path', '', false);

SET
  check_function_bodies = false;

SET
  xmloption = content;

SET
  client_min_messages = warning;

SET
  row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--
CREATE SCHEMA IF NOT EXISTS public;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--
COMMENT ON SCHEMA public IS 'standard public schema';

SET
  default_tablespace = '';

SET
  default_table_access_method = heap;

--
-- Name: monolayer_alter_migration; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.test (
  id integer
);

--
-- PostgreSQL database dump complete
--
SET
  search_path TO "$user",
  public;
`;
