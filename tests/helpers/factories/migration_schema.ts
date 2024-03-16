import type { MigrationSchema } from "~/migrations/migration_schema.js";

export function migrationSchemaFactory(
	options?: Partial<MigrationSchema>,
): MigrationSchema {
	return {
		extensions: options?.extensions ?? {},
		table: options?.table ?? {},
		index: options?.index ?? {},
		foreignKeyConstraints: options?.foreignKeyConstraints ?? {},
		uniqueConstraints: options?.uniqueConstraints ?? {},
		checkConstraints: options?.checkConstraints ?? {},
		primaryKey: options?.primaryKey ?? {},
		triggers: options?.triggers ?? {},
		enums: options?.enums ?? {},
	};
}
