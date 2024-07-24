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
-- Name: monolayer_breaking_migration; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.monolayer_breaking_migration (
  name character varying(255) NOT NULL,
  "timestamp" character varying(255) NOT NULL
);

--
-- Name: monolayer_breaking_migration_lock; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.monolayer_breaking_migration_lock (
  id character varying(255) NOT NULL,
  is_locked integer DEFAULT 0 NOT NULL
);

--
-- Name: regulus_mint; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.regulus_mint (name text NOT NULL);

--
-- Name: monolayer_breaking_migration_lock monolayer_breaking_migration_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE
  ONLY public.monolayer_breaking_migration_lock
ADD
  CONSTRAINT monolayer_breaking_migration_lock_pkey PRIMARY KEY (id);

--
-- Name: monolayer_breaking_migration monolayer_breaking_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE
  ONLY public.monolayer_breaking_migration
ADD
  CONSTRAINT monolayer_breaking_migration_pkey PRIMARY KEY (name);

--
-- PostgreSQL database dump complete
--
SET
  search_path TO "$user",
  public;
