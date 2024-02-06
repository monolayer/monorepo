import type { ColumnIdentity } from "~/index.js";

export type InformationSchemaTables = {
	table_catalog: string | null;
	table_schema: string | null;
	table_name: string | null;
	table_type: string | null;
	self_referencing_column_name: string | null;
	reference_generation: string | null;
	user_defined_type_catalog: string | null;
	user_defined_type_schema: string | null;
	user_defined_type_name: string | null;
	is_insertable_into: string | null;
	is_typed: string | null;
	commit_action: string | null;
};

export type InformationSchemaTableConstraints = {
	constraint_catalog: string | null;
	constraint_schema: string | null;
	constraint_name: string | null;
	table_catalog: string | null;
	table_schema: string | null;
	table_name: string | null;
	constraint_type: "CHECK" | "FOREIGN KEY" | "PRIMARY KEY" | "UNIQUE";
	is_deferrable: "YES" | "NO";
	initially_deferred: "YES" | "NO";
	enforced: "YES" | "NO";
	nulls_distinct: "YES" | "NO";
};

export type InformationSchemaColumns = {
	numeric_precision: number | null;
	numeric_precision_radix: number | null;
	numeric_scale: number | null;
	datetime_precision: number | null;
	ordinal_position: number | null;
	maximum_cardinality: number | null;
	interval_precision: number | null;
	character_maximum_length: number | null;
	character_octet_length: number | null;
	character_set_schema: string | null;
	character_set_name: string | null;
	collation_catalog: string | null;
	collation_schema: string | null;
	collation_name: string | null;
	domain_catalog: string | null;
	domain_schema: string | null;
	domain_name: string | null;
	udt_catalog: string | null;
	udt_schema: string | null;
	udt_name: string | null;
	scope_catalog: string | null;
	scope_schema: string | null;
	scope_name: string | null;
	dtd_identifier: string | null;
	is_self_referencing: string | null;
	is_identity: "YES" | "NO" | null;
	identity_generation: ColumnIdentity.ByDefault | ColumnIdentity.Always | null;
	identity_start: string | null;
	identity_increment: string | null;
	identity_maximum: string | null;
	identity_minimum: string | null;
	identity_cycle: string | null;
	is_generated: string | null;
	generation_expression: string | null;
	table_catalog: string | null;
	is_updatable: string | null;
	table_schema: string | null;
	table_name: string | null;
	column_name: string | null;
	column_default: string | null;
	is_nullable: string | null;
	data_type: string | null;
	interval_type: string | null;
	character_set_catalog: string | null;
	nullable: boolean | null;
	renameFrom: string | null;
};

export type InformationSchemaKeyColumnUsage = {
	table_catalog: string | null;
	table_schema: string | null;
	table_name: string | null;
	column_name: string | null;
	ordinal_position: number | null;
	position_in_unique_constraint: number | null;
	constraint_catalog: string | null;
	constraint_schema: string | null;
	constraint_name: string | null;
};

export type InformationSchemaConstraintColumnUsage = {
	table_catalog: string | null;
	table_schema: string | null;
	table_name: string | null;
	column_name: string | null;
	constraint_catalog: string | null;
	constraint_schema: string | null;
	constraint_name: string | null;
};

export type InformationSchemaReferentialConstraints = {
	constraint_catalog: string | null;
	constraint_schema: string | null;
	constraint_name: string | null;
	unique_constraint_catalog: string | null;
	unique_constraint_schema: string | null;
	unique_constraint_name: string | null;
	match_option: string | null;
	update_rule:
		| "CASCADE"
		| "SET NULL"
		| "SET DEFAULT"
		| "RESTRICT"
		| "NO ACTION"
		| null;
	delete_rule:
		| "CASCADE"
		| "SET NULL"
		| "SET DEFAULT"
		| "RESTRICT"
		| "NO ACTION"
		| null;
};

export type PgIndexTable = {
	indrelid: number;
	indexrelid: number;
	indisprimary: boolean;
};

export type PgNamespaceTable = {
	oid: number;
	nspname: string;
};

export type PgClassTable = {
	oid: number;
	relname: string;
	relkind: string;
	relnamespace: number;
};

export type InformationSchemaDB = {
	"information_schema.tables": InformationSchemaTables;
	"information_schema.columns": InformationSchemaColumns;
	"information_schema.key_column_usage": InformationSchemaKeyColumnUsage;
	"information_schema.constraint_column_usage": InformationSchemaConstraintColumnUsage;
	"information_schema.table_constraints": InformationSchemaTableConstraints;
	"information_schema.referential_constraints": InformationSchemaReferentialConstraints;
	pg_index: PgIndexTable;
	pg_namespace: PgNamespaceTable;
	pg_class: PgClassTable;
};
