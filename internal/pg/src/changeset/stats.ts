/* eslint-disable max-lines */
import { ChangesetType, type Changeset } from "~pg/changeset/types.js";

export type SummaryStats = {
	added: number;
	dropped: number;
	altered: number;
	renamed: number;
};

type SchemaStats = {
	tableSummary: SummaryStats;
	tables: Record<string, TableStats>;
	tableNameChanges: Record<string, string>;
	addedTables: string[];
	droppedTables: string[];
	enumTypes: SummaryStats;
};

export type TableStats = {
	columns: SummaryStats;
	primaryKeys: SummaryStats;
	foreignKeys: SummaryStats;
	uniqueConstraints: SummaryStats;
	checkConstraints: SummaryStats;
	indexes: SummaryStats;
	triggers: SummaryStats;
};

export type ChangesetStats = {
	database: DbStats;
	databaseSchemas: Record<string, SchemaStats>;
};

export type AddDropStats = { added: number; dropped: number };

type DbStats = {
	extensions: AddDropStats;
	schemaSummary: AddDropStats;
};

type Ops = "add" | "drop" | "alter" | "rename";

const dbStatsFn: Record<
	string,
	{
		key: keyof DbStats;
		op: Extract<Ops, "add" | "drop">;
	}
> = {
	[`${ChangesetType.CreateSchema}`]: { key: "schemaSummary", op: "add" },
	[`${ChangesetType.DropSchema}`]: { key: "schemaSummary", op: "drop" },
	[`${ChangesetType.CreateExtension}`]: { key: "extensions", op: "add" },
	[`${ChangesetType.DropExtension}`]: { key: "extensions", op: "drop" },
};

const tableStatsFn: Record<
	string,
	{
		key: keyof TableStats;
		op: Ops;
	}
> = {
	[`${ChangesetType.CreatePrimaryKey}`]: { key: "primaryKeys", op: "add" },
	[`${ChangesetType.DropPrimaryKey}`]: { key: "primaryKeys", op: "drop" },
	[`${ChangesetType.CreateForeignKey}`]: { key: "foreignKeys", op: "add" },
	[`${ChangesetType.DropForeignKey}`]: { key: "foreignKeys", op: "drop" },
	[`${ChangesetType.RenameForeignKey}`]: { key: "foreignKeys", op: "rename" },
	[`${ChangesetType.CreateColumn}`]: { key: "columns", op: "add" },
	[`${ChangesetType.DropColumn}`]: { key: "columns", op: "drop" },
	[`${ChangesetType.ChangeColumn}`]: { key: "columns", op: "alter" },
	[`${ChangesetType.CreateIndex}`]: { key: "indexes", op: "add" },
	[`${ChangesetType.RenameIndex}`]: { key: "indexes", op: "rename" },
	[`${ChangesetType.DropIndex}`]: { key: "indexes", op: "drop" },
	[`${ChangesetType.CreateTrigger}`]: { key: "triggers", op: "add" },
	[`${ChangesetType.DropTrigger}`]: { key: "triggers", op: "drop" },
	[`${ChangesetType.UpdateTrigger}`]: { key: "triggers", op: "alter" },
	[`${ChangesetType.RenameColumn}`]: { key: "columns", op: "rename" },
	[`${ChangesetType.CreateUnique}`]: { key: "uniqueConstraints", op: "add" },
	[`${ChangesetType.DropUnique}`]: { key: "uniqueConstraints", op: "drop" },
	[`${ChangesetType.RenameUnique}`]: { key: "uniqueConstraints", op: "rename" },
	[`${ChangesetType.CreateCheck}`]: { key: "checkConstraints", op: "add" },
	[`${ChangesetType.RenameCheck}`]: { key: "checkConstraints", op: "rename" },
	[`${ChangesetType.DropCheck}`]: { key: "checkConstraints", op: "drop" },
};

type TableAlterations = Record<string, Record<string, boolean>>;

export function changesetStats(changesets: Changeset[]) {
	const stats: ChangesetStats = {
		database: {
			extensions: { added: 0, dropped: 0 },
			schemaSummary: { added: 0, dropped: 0 },
		},
		databaseSchemas: {},
	};

	const tableAlterations: TableAlterations = {};
	const result = changesets.reduce((acc, changeset) => {
		for (const key in dbStatsFn) {
			if (key === changeset.type) {
				const keyAndOp = dbStatsFn[key as keyof typeof dbStatsFn]!;
				processDbStats(acc, keyAndOp.key, keyAndOp.op);
				return acc;
			}
		}
		if (addEnumStats(changeset, acc)) return acc;
		if (addTableStats(changeset, acc, tableAlterations)) return acc;

		for (const key in tableStatsFn) {
			if (key === changeset.type) {
				const keyAndOp = tableStatsFn[key]!;
				processTableStats(
					changeset,
					acc,
					keyAndOp.key,
					changeset.type,
					keyAndOp.op,
					tableAlterations,
				);
			}
		}
		return acc;
	}, stats);
	return result;
}

export function processDbStats(
	changesetStats: ChangesetStats,
	statName: keyof DbStats,
	op: "add" | "drop" | "alter",
) {
	switch (op) {
		case "add":
			changesetStats.database[statName].added++;
			break;
		case "drop":
			changesetStats.database[statName].dropped++;
			break;
		default:
			return false;
	}
}

function initSchemaStats(
	schemas: Record<string, SchemaStats>,
	schemaName: string,
) {
	if (schemas[schemaName] === undefined) {
		schemas[schemaName] = {
			enumTypes: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			tableSummary: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			tables: {},
			tableNameChanges: {},
			addedTables: [],
			droppedTables: [],
		};
	}
	return schemas[schemaName]!;
}

function addEnumStats(changeset: Changeset, stats: ChangesetStats) {
	if (changeset.schemaName === null) {
		return false;
	} else {
		const schemaStats = initSchemaStats(
			stats.databaseSchemas,
			changeset.schemaName,
		);
		switch (changeset.type) {
			case ChangesetType.CreateEnum:
				schemaStats.enumTypes.added++;
				break;
			case ChangesetType.DropEnum:
				schemaStats.enumTypes.dropped++;
				break;
			case ChangesetType.ChangeEnum:
				schemaStats.enumTypes.altered++;
				break;
			default:
				return false;
		}
		return true;
	}
}

function addTableAlteration(
	changeset: Changeset,
	stats: SummaryStats,
	tableAlterations: TableAlterations,
) {
	const schemaName = changeset.schemaName!;
	const tableName = changeset.currentTableName;
	tableAlterations[schemaName] = tableAlterations[schemaName] || {};
	const schemaAlterations = tableAlterations[schemaName]!;
	schemaAlterations[tableName] = schemaAlterations[tableName] || false;
	if (schemaAlterations[tableName] === false) {
		stats.altered++;
		schemaAlterations[tableName] = true;
	}
}

function addTableStats(
	changeset: Changeset,
	stats: ChangesetStats,
	tableAlterations: TableAlterations,
) {
	if (changeset.schemaName === null) {
		return false;
	} else {
		const schemaStats = initSchemaStats(
			stats.databaseSchemas,
			changeset.schemaName,
		);
		const tableStats = initTableStats(
			schemaStats.tables,
			changeset.currentTableName,
		);
		switch (changeset.type) {
			case ChangesetType.CreateTable:
				schemaStats.tableSummary.added++;
				tableStats.columns.added = (
					changeset.up.toString().match(/addColumn/g) ?? []
				).length;
				schemaStats.addedTables.push(changeset.currentTableName);
				break;
			case ChangesetType.DropTable:
				schemaStats.tableSummary.dropped++;
				schemaStats.droppedTables.push(changeset.currentTableName);
				break;
			case ChangesetType.RenameTable:
				schemaStats.tableNameChanges[changeset.currentTableName] =
					changeset.tableName;
				addTableAlteration(
					changeset,
					schemaStats.tableSummary,
					tableAlterations,
				);
				break;
			default:
				return false;
		}
		return true;
	}
}

function initTableStats(tables: Record<string, TableStats>, tableName: string) {
	if (tables[tableName] === undefined) {
		tables[tableName] = {
			columns: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			primaryKeys: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			foreignKeys: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			uniqueConstraints: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			checkConstraints: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			indexes: { added: 0, dropped: 0, altered: 0, renamed: 0 },
			triggers: { added: 0, dropped: 0, altered: 0, renamed: 0 },
		};
	}
	return tables[tableName]!;
}

export function processTableStats(
	changeset: Changeset,
	changesetStats: ChangesetStats,
	statName: keyof TableStats,
	match: ChangesetType,
	op: "add" | "drop" | "alter" | "rename",
	tableAlterations: TableAlterations,
) {
	if (changeset.currentTableName === "none") {
		return false;
	}
	const tableName = changeset.currentTableName;
	if (changeset.schemaName === null) {
		return false;
	} else {
		const schemaStats = initSchemaStats(
			changesetStats.databaseSchemas,
			changeset.schemaName,
		);
		const stats = initTableStats(schemaStats.tables, tableName);

		if (changeset.type === match) {
			switch (op) {
				case "add":
					addTableAlteration(
						changeset,
						schemaStats.tableSummary,
						tableAlterations,
					);
					stats[statName].added++;
					return true;
				case "drop":
					addTableAlteration(
						changeset,
						schemaStats.tableSummary,
						tableAlterations,
					);
					stats[statName].dropped++;
					return true;
				case "alter":
					addTableAlteration(
						changeset,
						schemaStats.tableSummary,
						tableAlterations,
					);
					stats[statName].altered++;
					return true;
				case "rename":
					addTableAlteration(
						changeset,
						schemaStats.tableSummary,
						tableAlterations,
					);
					stats[statName].renamed++;
					return true;
				default:
					break;
			}
		}
		return false;
	}
}
