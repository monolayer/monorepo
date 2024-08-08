import { extractColumnsFromPrimaryKey } from "../introspection/schema.js";
import { currentTableName } from "../introspection/table-name.js";
import type { GeneratorContext } from "./schema-changeset.js";
import type { SplitColumnRefactoring } from "./schema-refactor.js";
import { ChangesetPhase, ChangeSetType, MigrationOpPriority } from "./types.js";

export function splitRefactorChangesets(
	splitRefactors: SplitColumnRefactoring[],
	context: GeneratorContext,
) {
	return splitRefactors.flatMap((splitRefactor) => {
		const schemaName = splitRefactor.schema;
		const tableName = splitRefactor.tableName;
		const pk = Object.values(context.local.primaryKey[tableName] ?? {});
		const primaryKeyName = extractColumnsFromPrimaryKey(pk[0]!)[0]!;
		const primaryKeyType =
			context.local.table[tableName]?.columns[primaryKeyName]?.dataType ===
			"text"
				? "text"
				: "integer";
		const expandChangeset = {
			transaction: false,
			priority: MigrationOpPriority.SplitColumnRefactor,
			phase: ChangesetPhase.Expand,
			tableName,
			currentTableName: currentTableName(
				tableName,
				context.tablesToRename,
				schemaName,
			),
			type: ChangeSetType.SplitColumnRefactor,
			up: [
				[
					`const refactor = new SplitColumnRefactor({
		schema: "${schemaName}",
		tableName: "${tableName}",
		primaryKeyColumn: "${primaryKeyName}",
		primaryKeyColumnType: "${primaryKeyType}",
		sourceColumn: "${splitRefactor.sourceColumn}",
		targetColumns: [${splitRefactor.targetColumns.map((col) => `"${col}"`).join(", ")}],
	})
		.splitFn((value: string): { ${splitRefactor.targetColumns.map((col) => `${col}: string`).join("; ")} } => {
			return {
				${splitRefactor.targetColumns.map((col) => `${col}: ""`).join(",\n				")},
			};
		})
		.combineFn((data: { ${splitRefactor.targetColumns.map((col) => `${col}: string`).join("; ")} }): string => {
			return "";
		});
  refactor.prepare().execute(db);
  refactor.perform().execute(db);`,
				],
			],
			down: [
				[
					`await new SplitColumnRefactor({
		schema: "${schemaName}",
		tableName: "${tableName}",
		primaryKeyColumn: "${primaryKeyName}",
		primaryKeyColumnType: "${primaryKeyType}",
		sourceColumn: "${splitRefactor.sourceColumn}",
		targetColumns: [${splitRefactor.targetColumns.map((col) => `"${col}"`).join(",")}],
	})
		.down()
		.execute(db);`,
				],
			],
			schemaName,
		};
		const contractChangeset = {
			priority: MigrationOpPriority.SplitColumnRefactorDrop,
			phase: ChangesetPhase.Contract,
			tableName,
			currentTableName: currentTableName(
				tableName,
				context.tablesToRename,
				schemaName,
			),
			type: ChangeSetType.SplitColumnRefactor,
			up: [
				[
					`await new SplitColumnRefactor({
		schema: "${schemaName}",
		tableName: "${tableName}",
		primaryKeyColumn: "${primaryKeyName}",
		primaryKeyColumnType: "${primaryKeyType}",
		sourceColumn: "${splitRefactor.sourceColumn}",
		targetColumns: [${splitRefactor.targetColumns.map((col) => `"${col}"`).join(",")}],
	})
		.down()
		.execute(db);`,
				],
			],
			down: [],
			schemaName,
		};
		return [expandChangeset, contractChangeset];
	});
}
