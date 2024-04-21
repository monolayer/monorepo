import type { SchemaMigrationInfo } from "~/introspection/introspection.js";

export function schemaMigratonInfoFactory(
	options?: Partial<SchemaMigrationInfo>,
): SchemaMigrationInfo {
	return {
		table: options?.table ?? {},
		index: options?.index ?? {},
		foreignKeyConstraints: options?.foreignKeyConstraints ?? {},
		uniqueConstraints: options?.uniqueConstraints ?? {},
		checkConstraints: options?.checkConstraints ?? {},
		primaryKey: options?.primaryKey ?? {},
		triggers: options?.triggers ?? {},
		enums: options?.enums ?? {},
		tablePriorities: options?.tablePriorities ?? [],
	};
}
