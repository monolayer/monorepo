import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { validateForeignKeyReferences } from "~/changeset/validate-foreign-key-references.js";
import { ActionError } from "~/cli/errors.js";
import { schema } from "~/database/schema/schema.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { foreignKey } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { table } from "~/database/schema/table/table.js";
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
