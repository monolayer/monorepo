import type { PgExtension } from "@monorepo/pg/schema/extension.js";
import type { AnySchema } from "@monorepo/pg/schema/schema.js";
import { assert, test } from "vitest";
import type { Renames } from "~push/state/rename.js";
import { assertDb, refuteDb } from "../assertions/assertions.js";
import { assertSuccessfulPush } from "../assertions/push.js";
import type { TestContext } from "../setup.js";

interface SchemaTestCase {
	schema: AnySchema | AnySchema[] | (() => AnySchema | AnySchema[]);
	extensions?: PgExtension[];
	before?: (context: TestContext) => Promise<void> | void;
	expectedQueries?: string[];
	renames?: Renames;
	camelCase?: boolean;
	assertDatabase?: (helpers: {
		assert: ReturnType<typeof assertDb>;
		refute: ReturnType<typeof assertDb>;
	}) => Promise<void> | void;
}
export function testSchemaPush(name: string, schemaTestCase: SchemaTestCase) {
	return test<TestContext>(
		name,
		async (context) => {
			if (schemaTestCase.before !== undefined) {
				await schemaTestCase.before(context);
			}
			context.camelCase = schemaTestCase.camelCase ?? false;
			const queries = await assertSuccessfulPush(
				context,
				typeof schemaTestCase.schema === "function"
					? schemaTestCase.schema()
					: schemaTestCase.schema,
				schemaTestCase.extensions ?? [],
				schemaTestCase.renames,
			);
			if (schemaTestCase.expectedQueries) {
				assert.deepStrictEqual(queries, schemaTestCase.expectedQueries);
			}

			assert.deepStrictEqual(
				await assertSuccessfulPush(
					context,
					typeof schemaTestCase.schema === "function"
						? schemaTestCase.schema()
						: schemaTestCase.schema,
					schemaTestCase.extensions ?? [],
				),
				[],
			);
			if (schemaTestCase.assertDatabase !== undefined) {
				await schemaTestCase.assertDatabase({
					assert: assertDb(context),
					refute: refuteDb(context),
				});
			}
		},
		{ sequential: true, concurrent: false, retry: 2 },
	);
}

export async function assertSchemaPush(
	schemaTestCase: SchemaTestCase & { context: TestContext },
) {
	if (schemaTestCase.before !== undefined) {
		await schemaTestCase.before(schemaTestCase.context);
	}
	schemaTestCase.context.camelCase = schemaTestCase.camelCase ?? false;
	const queries = await assertSuccessfulPush(
		schemaTestCase.context,
		typeof schemaTestCase.schema === "function"
			? schemaTestCase.schema()
			: schemaTestCase.schema,
		schemaTestCase.extensions ?? [],
		schemaTestCase.renames,
	);
	if (schemaTestCase.expectedQueries) {
		assert.deepStrictEqual(queries, schemaTestCase.expectedQueries);
	}

	assert.deepStrictEqual(
		await assertSuccessfulPush(
			schemaTestCase.context,
			typeof schemaTestCase.schema === "function"
				? schemaTestCase.schema()
				: schemaTestCase.schema,
			schemaTestCase.extensions ?? [],
		),
		[],
	);
	if (schemaTestCase.assertDatabase !== undefined) {
		await schemaTestCase.assertDatabase({
			assert: assertDb(schemaTestCase.context),
			refute: refuteDb(schemaTestCase.context),
		});
	}
}
