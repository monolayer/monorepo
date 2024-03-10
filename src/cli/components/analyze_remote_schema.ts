import * as p from "@clack/prompts";
import { Kysely } from "kysely";
import pg from "pg";
import { exit } from "process";
import { remoteSchema } from "~/introspection/schemas.js";
import { ActionStatus } from "../command.js";

export async function analyzeRemoteSchema(
	environmentConfig: (pg.ClientConfig & pg.PoolConfig) | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
) {
	const b = p.spinner();
	b.start(`Analyzing schema from ${environmentConfig?.database} database`);

	const schema = await remoteSchema(kysely);
	if (schema.status === ActionStatus.Error) {
		b.stop("Error while fetching database information", 1);
		console.error(schema.error);
		exit(0);
	}

	b.stop(`Analyzed schema from ${environmentConfig?.database} database.`);

	return schema;
}
