-- Settings

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

CREATE TABLE public.accounts (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 email text NOT NULL,
 CONSTRAINT accounts_f368ca51_monolayer_key UNIQUE (email)
) TABLESPACE pg_default;
ALTER TABLE ONLY public.accounts ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
CREATE INDEX IF NOT EXISTS accounts_cf8cf26f_monolayer_idx ON public.accounts USING btree (email) TABLESPACE pg_default;
COMMENT ON COLUMN public.accounts.id IS 'eea9a3e7';

CREATE TABLE public.boards (
 id integer GENERATED ALWAYS AS IDENTITY NOT NULL NOT NULL,
 name text NOT NULL,
 color text NOT NULL DEFAULT '#e0e0e0'::text,
 "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
 "accountId" uuid NOT NULL
) TABLESPACE pg_default;
ALTER TABLE ONLY public.boards ADD CONSTRAINT boards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.boards ADD CONSTRAINT boards_58e1a15a_monolayer_fk FOREIGN KEY ("accountId") REFERENCES accounts(id);
CREATE INDEX IF NOT EXISTS boards_c8367c81_monolayer_idx ON public.boards USING btree ("accountId") TABLESPACE pg_default;
COMMENT ON COLUMN public.boards.createdAt IS '28a4dae0';
COMMENT ON COLUMN public.boards.color IS '22216187';

CREATE TABLE public.columns (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 name text NOT NULL,
 "boardId" integer NOT NULL,
 "order" double precision NOT NULL DEFAULT '0'::double precision
) TABLESPACE pg_default;
ALTER TABLE ONLY public.columns ADD CONSTRAINT columns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.columns ADD CONSTRAINT columns_cd31e386_monolayer_fk FOREIGN KEY ("boardId") REFERENCES boards(id) ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS columns_78973606_monolayer_idx ON public.columns USING btree ("boardId") TABLESPACE pg_default;
COMMENT ON COLUMN public.columns.order IS '6a590996';
COMMENT ON COLUMN public.columns.id IS 'eea9a3e7';

CREATE TABLE public.items (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 title text NOT NULL,
 content text NULL,
 "order" real NOT NULL,
 "columnId" uuid NOT NULL,
 "boardId" integer NOT NULL
) TABLESPACE pg_default;
ALTER TABLE ONLY public.items ADD CONSTRAINT items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.items ADD CONSTRAINT items_96b4f219_monolayer_fk FOREIGN KEY ("boardId") REFERENCES boards(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.items ADD CONSTRAINT items_42a31803_monolayer_fk FOREIGN KEY ("columnId") REFERENCES columns(id) ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS items_78973606_monolayer_idx ON public.items USING btree ("boardId") TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS items_1620437a_monolayer_idx ON public.items USING btree ("columnId") TABLESPACE pg_default;
COMMENT ON COLUMN public.items.id IS 'eea9a3e7';

CREATE TABLE public.passwords (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 salt text NOT NULL,
 hash text NOT NULL,
 "accountId" uuid NOT NULL,
 CONSTRAINT passwords_15e65ee2_monolayer_key UNIQUE ("accountId")
) TABLESPACE pg_default;
ALTER TABLE ONLY public.passwords ADD CONSTRAINT passwords_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.passwords ADD CONSTRAINT passwords_73bf2dc0_monolayer_fk FOREIGN KEY ("accountId") REFERENCES accounts(id);
CREATE INDEX IF NOT EXISTS passwords_c8367c81_monolayer_idx ON public.passwords USING btree ("accountId") TABLESPACE pg_default;
COMMENT ON COLUMN public.passwords.id IS 'eea9a3e7';

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

COMMENT ON COLUMN public.items.id IS 'eea9a3e7';
COMMENT ON COLUMN public.accounts.id IS 'eea9a3e7';
COMMENT ON COLUMN public.passwords.id IS 'eea9a3e7';
COMMENT ON COLUMN public.boards.color IS '22216187';
COMMENT ON COLUMN public.boards."createdAt" IS '28a4dae0';
COMMENT ON COLUMN public.columns.id IS 'eea9a3e7';
COMMENT ON COLUMN public.columns."order" IS '6a590996';

-- Migration Data

INSERT INTO public.kysely_migration VALUES ('20240516110840356-add-accounts', '2024-05-16T11:08:40.452Z');
INSERT INTO public.kysely_migration VALUES ('20240516111121976-add-passwords', '2024-05-16T11:11:22.051Z');
INSERT INTO public.kysely_migration VALUES ('20240516111659418-add-boards', '2024-05-16T11:16:59.498Z');
INSERT INTO public.kysely_migration VALUES ('20240516111840948-add-columns', '2024-05-16T11:18:41.046Z');
INSERT INTO public.kysely_migration VALUES ('20240516112102254-add-items', '2024-05-16T11:21:02.299Z');
INSERT INTO public.kysely_migration_lock VALUES ('migration_lock', 0);
