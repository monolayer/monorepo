import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import { type AnySchema } from "~/database/schema/schema.js";
import {
	introspectLocalSchema,
	introspectRemoteSchema,
} from "~/introspection/introspection.js";

export function introspectSchemas({
	kyselyInstance,
	localSchema,
	schemaName,
	camelCasePlugin,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kyselyInstance: Kysely<any>;
	localSchema: AnySchema;
	schemaName: string;
	camelCasePlugin: CamelCaseOptions;
}) {
	return Effect.unit.pipe(
		Effect.flatMap(() =>
			Effect.tryPromise(() =>
				introspectRemoteSchema(kyselyInstance, schemaName),
			),
		),
		Effect.flatMap((introspectedRemote) =>
			Effect.unit.pipe(
				Effect.flatMap(() =>
					Effect.succeed(
						introspectLocalSchema(
							localSchema,
							introspectedRemote,
							camelCasePlugin,
						),
					),
				),
				Effect.flatMap((introspectedLocalSchema) =>
					Effect.succeed({
						local: introspectedLocalSchema,
						remote: introspectedRemote,
					}),
				),
			),
		),
	);
}
