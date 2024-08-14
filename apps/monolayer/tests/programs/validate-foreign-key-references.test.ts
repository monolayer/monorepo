import { ActionError } from "@monorepo/base/errors.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { foreignKey } from "@monorepo/pg/schema/foreign-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { validateForeignKeyReferences } from "~monolayer/changeset/validate-foreign-key-references.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("validateLocalSchema", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test("pass validate schema", async () => {
		expect(true).toBe(true);

		const users = table({
			columns: {
				id: integer(),
			},
		});

		const documents = table({
			columns: {
				name: text(),
				userId: integer(),
			},
			constraints: {
				foreignKeys: [foreignKey(["userId"], users, ["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				documents,
			},
		});

		const result = Effect.runSync(
			validateForeignKeyReferences(dbSchema, [dbSchema]),
		);
		expect(result).toBe(true);
	});

	test("fail validate schema", async () => {
		expect(true).toBe(true);

		const users = table({
			columns: {
				id: integer(),
			},
		});

		const documents = table({
			columns: {
				name: text(),
				userId: integer(),
			},
			constraints: {
				foreignKeys: [foreignKey(["userId"], users, ["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
			},
		});

		const result = Effect.runSync(
			validateForeignKeyReferences(dbSchema, [dbSchema]).pipe(
				Effect.catchAll((error) => {
					return Effect.succeed(error);
				}),
			),
		);
		expect(result).toBeInstanceOf(ActionError);
		const error = result as ActionError;
		expect(error.message).toBe(
			"Foreign key in table documents references a table that is not in the schema",
		);
	});
});
