import type { MigrationSchema } from "~/database/migrations/migration_schema.js";

export function migrationSchemaFactory(
	options?: Partial<MigrationSchema>,
): MigrationSchema {
	return {
		extensions: options?.extensions ?? {},
		table: options?.table ?? {},
		index: options?.index ?? {},
		foreignKeyConstraints: options?.foreignKeyConstraints ?? {},
		uniqueConstraints: options?.uniqueConstraints ?? {},
		primaryKey: options?.primaryKey ?? {},
		triggers: options?.triggers ?? {},
	};
}
