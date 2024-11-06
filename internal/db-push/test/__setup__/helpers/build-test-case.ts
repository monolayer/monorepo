import type { AnySchema } from "@monorepo/pg/schema/schema.js";
import { assert, test } from "vitest";
import type { Renames } from "~db-push/state/rename.js";
import { assertDb, refuteDb } from "../assertions/assertions.js";
import { assertSuccessfulPush } from "../assertions/push.js";
import type { TestContext } from "../setup.js";

interface SchemaTestCase {
	schema: AnySchema;
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
	return test<TestContext>(name, async (context) => {
		if (schemaTestCase.before !== undefined) {
			await schemaTestCase.before(context);
		}
		context.camelCase = schemaTestCase.camelCase ?? false;
		const queries = await assertSuccessfulPush(
			context,
			schemaTestCase.schema,
			schemaTestCase.renames,
		);
		if (schemaTestCase.expectedQueries) {
			assert.deepStrictEqual(queries, schemaTestCase.expectedQueries);
		}

		assert.deepStrictEqual(
			await assertSuccessfulPush(context, schemaTestCase.schema),
			[],
		);
		if (schemaTestCase.assertDatabase !== undefined) {
			await schemaTestCase.assertDatabase({
				assert: assertDb(context),
				refute: refuteDb(context),
			});
		}
	});
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
		schemaTestCase.schema,
		schemaTestCase.renames,
	);
	if (schemaTestCase.expectedQueries) {
		assert.deepStrictEqual(queries, schemaTestCase.expectedQueries);
	}

	assert.deepStrictEqual(
		await assertSuccessfulPush(schemaTestCase.context, schemaTestCase.schema),
		[],
	);
	if (schemaTestCase.assertDatabase !== undefined) {
		await schemaTestCase.assertDatabase({
			assert: assertDb(schemaTestCase.context),
			refute: refuteDb(schemaTestCase.context),
		});
	}
}

export function testSchemaPushSkip(
	name: string,
	schemaTestCase: SchemaTestCase,
) {
	return test.skip<TestContext>(name, async (context) => {
		if (schemaTestCase.before !== undefined) {
			await schemaTestCase.before(context);
		}
		const queries = await assertSuccessfulPush(
			context,
			schemaTestCase.schema,
			schemaTestCase.renames ?? {},
		);
		assert.deepStrictEqual(queries, schemaTestCase.expectedQueries);

		assert.deepStrictEqual(
			await assertSuccessfulPush(context, schemaTestCase.schema),
			[],
		);
	});
}
