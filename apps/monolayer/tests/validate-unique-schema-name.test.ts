import { ActionError } from "@monorepo/base/errors.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Ref } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { validateUniqueSchemaName } from "~/changeset/validate-unique-schema-name.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";
import { MonolayerPgConfiguration } from "../src/pg.js";

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
			configurationName: "default",
			folder: ".",
			configuration: new MonolayerPgConfiguration({
				schemas: [dbSchema, anotherSchema],
				camelCasePlugin: { enabled: false },
				extensions: [],
			}),
		};

		const result = Effect.runSync(
			Effect.provideServiceEffect(
				validateUniqueSchemaName(),
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
			configurationName: "default",
			folder: ".",
			configuration: new MonolayerPgConfiguration({
				schemas: [dbSchema, anotherSchema],
				camelCasePlugin: { enabled: false },
				extensions: [],
			}),
		};

		const result = Effect.runSync(
			Effect.provideServiceEffect(
				validateUniqueSchemaName(),
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
			configurationName: "default",
			folder: ".",
			configuration: new MonolayerPgConfiguration({
				schemas: [dbSchema, anotherSchema],
				camelCasePlugin: { enabled: false },
				extensions: [],
			}),
		};

		const result = Effect.runSync(
			Effect.provideServiceEffect(
				validateUniqueSchemaName(),
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
