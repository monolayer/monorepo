import { Kysely } from "kysely";
import { kyselyConfig } from "monolayer/config";
import configuration from "./configuration";
import { type DB } from "./schema";

export const defaultDb = new Kysely<DB>(
	kyselyConfig(configuration, process.env.NODE_ENV || "development")
);