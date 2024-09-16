import { ActionError } from "@monorepo/cli/errors.js";
import { PgDatabase } from "@monorepo/pg/database.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { validateUniqueSchemaName } from "@monorepo/programs/validate-unique-schema-name.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Ref } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("validate uique schema name", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test("pass", async () => {
		const dbSchema = schema({});
		const anotherSchema = schema({
			name: "another",
		});

		const env: AppEnv = {
			databases: "databases.ts",
			currentDatabase: new PgDatabase({
				id: "default",
				schemas: [dbSchema, anotherSchema],
				camelCase: false,
				extensions: [],
			}),
		};

		const result = Effect.runSync(
			Effect.provideServiceEffect(
				validateUniqueSchemaName,
				AppEnvironment,
				Ref.make(env),
			),
		);
		expect(result).toBe(true);
	});

	test("fail with multiple public schemas with same name", async () => {
		const dbSchema = schema({});
		const anotherSchema = schema({});

		const env: AppEnv = {
			databases: "databases.ts",
			currentDatabase: new PgDatabase({
				id: "default",
				schemas: [dbSchema, anotherSchema],
				camelCase: false,
				extensions: [],
			}),
		};

		const result = Effect.runSync(
			Effect.provideServiceEffect(
				validateUniqueSchemaName,
				AppEnvironment,
				Ref.make(env),
			).pipe(
				Effect.catchAll((error) => {
					return Effect.succeed(error);
				}),
			),
		);
		expect(result).toBeInstanceOf(ActionError);
		const error = result as ActionError;
		expect(error.message).toBe(
			"Multiple schemas with the same name: 'public'.",
		);
	});

	test("fail with multiple schemas with same name", async () => {
		const dbSchema = schema({ name: "demo" });
		const anotherSchema = schema({ name: "demo" });

		const env: AppEnv = {
			databases: "databases.ts",
			currentDatabase: new PgDatabase({
				id: "default",
				schemas: [dbSchema, anotherSchema],
				camelCase: false,
				extensions: [],
			}),
		};

		const result = Effect.runSync(
			Effect.provideServiceEffect(
				validateUniqueSchemaName,
				AppEnvironment,
				Ref.make(env),
			).pipe(
				Effect.catchAll((error) => {
					return Effect.succeed(error);
				}),
			),
		);
		expect(result).toBeInstanceOf(ActionError);
		const error = result as ActionError;
		expect(error.message).toBe("Multiple schemas with the same name: 'demo'.");
	});
});
