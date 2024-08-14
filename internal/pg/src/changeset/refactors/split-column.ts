import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import {
	ChangesetPhase,
	ChangeSetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import { currentTableName } from "~pg/introspection/introspection/table-name.js";
import { extractColumnsFromPrimaryKey } from "~pg/introspection/schema.js";

export interface SplitColumnRefactoring {
	schema: string;
	tableName: string;
	sourceColumn: string;
	targetColumns: string[];
}

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
