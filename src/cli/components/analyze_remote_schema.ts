import * as p from "@clack/prompts";
import { Kysely } from "kysely";
import pg from "pg";
import { exit } from "process";
import {
	dbColumnInfo,
	dbIndexInfo,
	dbTableInfo,
} from "~/database/introspection/database.js";
import { ActionStatus } from "../command.js";

export async function analyzeRemoteSchema(
	environmentConfig: (pg.ClientConfig & pg.PoolConfig) | undefined,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	kysely: Kysely<any>,
) {
	const b = p.spinner();
	b.start(`Analyzing schema from ${environmentConfig?.database} database`);

	const remoteTableInfo = await dbTableInfo(kysely, "public");

	if (remoteTableInfo.status === ActionStatus.Error) {
		b.stop("Unexpected error while fetching database information", 1);
		console.error(remoteTableInfo.error);
		exit(1);
	}

	const tables = remoteTableInfo.result.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const remoteColumnInfo = await dbColumnInfo(kysely, "public", tables);

	if (remoteColumnInfo.status === ActionStatus.Error) {
		b.stop("Error while fetching database information", 1);
		console.error(remoteColumnInfo.error);
		exit(0);
	}

	const remoteIndexInfo = await dbIndexInfo(kysely, "public", tables);

	if (remoteIndexInfo.status === ActionStatus.Error) {
		b.stop("Error while fetching database information", 1);
		console.error(remoteIndexInfo.error);
		exit(0);
	}

	b.stop(`Analyzed schema from ${environmentConfig?.database} database.`);
	return {
		table: remoteColumnInfo,
		index: remoteIndexInfo,
	};
}
