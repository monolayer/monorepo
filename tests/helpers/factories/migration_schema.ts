import type { MigrationSchema } from "~/database/migrations/migration_schema.js";

export function migrationSchemaFactory(
	options?: Partial<MigrationSchema>,
): MigrationSchema {
	return {
		table: options?.table ?? {},
		index: options?.index ?? {},
		foreignKeyConstraints: options?.foreignKeyConstraints ?? {},
		uniqueConstraints: options?.uniqueConstraints ?? {},
		primaryKey: options?.primaryKey ?? {},
	};
}
