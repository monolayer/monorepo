import { DbClients } from "@monorepo/services/db-clients.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { pathExists } from "@monorepo/utils/path.js";
import { gen, tryPromise } from "effect/Effect";
import fs from "fs/promises";
import { sql, type Kysely } from "kysely";
import path from "node:path";
import { cwd } from "node:process";

const PROMPT_STATE_TABLE_NAME = "monolayer_prompt_state";

export type StateDB = {
	[PROMPT_STATE_TABLE_NAME]: {
		id: {
			readonly __select__: number;
			readonly __insert__: never;
			readonly __update__: never;
		};
		type: {
			readonly __select__: "table_rename" | "column_rename";
			readonly __insert__: "table_rename" | "column_rename";
			readonly __update__: "table_rename" | "column_rename";
		};
		name: {
			readonly __select__: string;
			readonly __insert__: string;
			readonly __update__: string;
		};
		updatedAt: {
			readonly __select__: Date;
			readonly __insert__: Date | undefined;
			readonly __update__: Date;
		};
	};
};

export class PromptState {
	constructor(private db: Kysely<StateDB>) {}

	async ensureTableExists() {
		await this.db.schema
			.createTable(PROMPT_STATE_TABLE_NAME)
			.addColumn("id", "integer", (col) =>
				col.notNull().primaryKey().generatedAlwaysAsIdentity(),
			)
			.addColumn("type", "text", (col) => col.notNull())
			.addColumn("name", "text", (col) => col.notNull())
			.addColumn("updatedAt", "timestamptz", (col) =>
				col.notNull().defaultTo(sql`NOW()`),
			)
			.ifNotExists()
			.execute();
	}

	async createTableRename(name: string) {
		return await this.#create(name, "table_rename");
	}

	async createColumnRename(name: string) {
		return await this.#create(name, "column_rename");
	}

	async #create(name: string, type: "table_rename" | "column_rename") {
		return await this.db
			.insertInto(PROMPT_STATE_TABLE_NAME)
			.values({ name, type })
			.returningAll()
			.execute();
	}

	async all() {
		return await this.db
			.selectFrom(PROMPT_STATE_TABLE_NAME)
			.selectAll()
			.execute();
	}

	async allColumnRename() {
		return await this.db
			.selectFrom(PROMPT_STATE_TABLE_NAME)
			.where("type", "=", "column_rename")
			.selectAll()
			.execute();
	}

	async allTableRenames() {
		return await this.db
			.selectFrom(PROMPT_STATE_TABLE_NAME)
			.where("type", "=", "table_rename")
			.selectAll()
			.execute();
	}
}

export const updatePromptStateWithUnexecutedRenames = gen(function* () {
	const appEnv = yield* appEnvironment;
	const tableRenameStatePath = path.join(
		appEnv.currentWorkingDir ?? cwd(),
		"monolayer",
		"state",
		"table-renames",
	);

	const renames: string[] = [];
	const promptState = new PromptState((yield* DbClients).kyselyNoCamelCase);
	yield* tryPromise(() => promptState.ensureTableExists());
	const executedRenames = yield* tryPromise(() =>
		promptState.allTableRenames(),
	);
	if (yield* pathExists(tableRenameStatePath)) {
		const files = yield* tryPromise(() => fs.readdir(tableRenameStatePath));
		for (const fileName of files) {
			if (fileName.endsWith(".json")) {
				if (
					executedRenames.find((rename) => rename.name === fileName) ===
					undefined
				) {
					yield* tryPromise(() => promptState.createTableRename(fileName));
				}
			}
		}
	}
	return renames;
});

export const updatePromptStateWithUnexecutedColumnRenames = gen(function* () {
	const appEnv = yield* appEnvironment;
	const columnRenameStatePath = path.join(
		appEnv.currentWorkingDir ?? cwd(),
		"monolayer",
		"state",
		"column-renames",
	);

	const renames: string[] = [];
	const promptState = new PromptState((yield* DbClients).kyselyNoCamelCase);
	yield* tryPromise(() => promptState.ensureTableExists());
	const executedRenames = yield* tryPromise(() =>
		promptState.allColumnRename(),
	);
	if (yield* pathExists(columnRenameStatePath)) {
		const files = yield* tryPromise(() => fs.readdir(columnRenameStatePath));
		for (const fileName of files) {
			if (fileName.endsWith(".json")) {
				if (
					executedRenames.find((rename) => rename.name === fileName) ===
					undefined
				) {
					yield* tryPromise(() => promptState.createColumnRename(fileName));
				}
			}
		}
	}
	return renames;
});
