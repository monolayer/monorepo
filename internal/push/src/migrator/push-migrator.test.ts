/* eslint-disable max-lines */
import { sql } from "kysely";
import { type TestContext } from "test/__setup__/setup.js";
import { assert, test } from "vitest";
import type { AnyKysely } from "~push/changeset/introspection.js";
import { ChangesetPhase, ChangesetType } from "../changeset/types/changeset.js";
import {
	PushMigrator,
	type AlterPushMigration,
	type ContractPushMigration,
	type ExpandPushMigration,
} from "./push-migrator.js";

test<TestContext>("push all migration phases", async (context) => {
	const expandMigrations: ExpandPushMigration[] = [
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("users").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("users").execute();
			},
		},
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("teams").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("teams").execute();
			},
		},
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("hello").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("hello").execute();
			},
		},
	];

	const alterMigrations: AlterPushMigration[] = [
		{
			type: ChangesetType.CreateColumn,
			phase: ChangesetPhase.Alter,
			up: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("users")
					.addColumn("name", "text")
					.execute();
			},
			down: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("users")
					.dropColumn("name")
					.execute();
			},
		},
		{
			type: ChangesetType.CreateColumn,
			phase: ChangesetPhase.Alter,
			up: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("teams")
					.addColumn("location", "text")
					.execute();
			},
			down: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("teams")
					.dropColumn("location")
					.execute();
			},
		},
	];

	const contractMigrations: ContractPushMigration[] = [
		{
			type: ChangesetType.DropTable,
			phase: ChangesetPhase.Contract,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("hello").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("hello").execute();
			},
		},
	];

	const pushMigrator = new PushMigrator({ db: context.dbClient });
	await pushMigrator.push({
		expand: expandMigrations,
		alter: alterMigrations,
		contract: contractMigrations,
	});

	const tables = await context.dbClient.introspection.getTables();

	assert.deepStrictEqual(tables.find((t) => t.name === "users")?.columns, [
		{
			name: "name",
			dataType: "text",
			dataTypeSchema: "pg_catalog",
			isNullable: true,
			isAutoIncrementing: false,
			hasDefaultValue: false,
			comment: undefined,
		},
	]);
	assert.deepStrictEqual(tables.find((t) => t.name === "teams")?.columns, [
		{
			name: "location",
			dataType: "text",
			dataTypeSchema: "pg_catalog",
			isNullable: true,
			isAutoIncrementing: false,
			hasDefaultValue: false,
			comment: undefined,
		},
	]);
	assert.isUndefined(tables.find((t) => t.name === "hello"));
});

test<TestContext>("push migrations without transactions", async (context) => {
	const expandMigrations: ExpandPushMigration[] = [
		{
			type: ChangesetType.CreateColumn,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.createTable("users")
					.addColumn("name", "text")
					.execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("users").execute();
			},
		},
		{
			type: ChangesetType.CreateIndex,
			phase: ChangesetPhase.Expand,
			transaction: false,
			up: async (db: AnyKysely) => {
				try {
					await sql`${sql.raw('create index concurrently "users_3cf2733f_monolayer_idx" on "public"."users" ("name")')}`.execute(
						db,
					);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (error: any) {
					if (error.code === "23505") {
						await db
							.withSchema("public")
							.schema.dropIndex("users_3cf2733f_monolayer_idx")
							.ifExists()
							.execute();
					}
					throw error;
				}
			},
			down: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.dropIndex("users_3cf2733f_monolayer_idx")
					.ifExists()
					.execute();
			},
		},
	];

	const pushMigrator = new PushMigrator({ db: context.dbClient });
	await pushMigrator.push({
		expand: expandMigrations,
	});

	const tables = await context.dbClient.introspection.getTables();

	assert.deepStrictEqual(tables.find((t) => t.name === "users")?.columns, [
		{
			name: "name",
			dataType: "text",
			dataTypeSchema: "pg_catalog",
			isNullable: true,
			isAutoIncrementing: false,
			hasDefaultValue: false,
			comment: undefined,
		},
	]);
});

test.skip<TestContext>("rollbacks all migration phases on error", async (context) => {
	const expandMigrations: ExpandPushMigration[] = [
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("users").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("users").execute();
			},
		},
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("teams").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("teams").execute();
			},
		},
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("hello").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("hello").execute();
			},
		},
	];

	const alterMigrations: AlterPushMigration[] = [
		{
			type: ChangesetType.CreateColumn,
			phase: ChangesetPhase.Alter,
			up: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("users")
					.addColumn("name", "text")
					.execute();
			},
			down: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("users")
					.dropColumn("name")
					.execute();
			},
		},
		{
			type: ChangesetType.CreateColumn,
			phase: ChangesetPhase.Alter,
			up: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("teams")
					.addColumn("location", "text")
					.execute();
			},
			down: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.alterTable("teams")
					.dropColumn("location")
					.execute();
			},
		},
	];

	const contractMigrations: ContractPushMigration[] = [
		{
			type: ChangesetType.DropTable,
			phase: ChangesetPhase.Contract,
			up: async (db: AnyKysely) => {
				await db.withSchema("pubklic").schema.dropTable("hello").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("hello").execute();
			},
		},
	];

	const pushMigrator = new PushMigrator({ db: context.dbClient });

	await pushMigrator.push({
		expand: expandMigrations,
		alter: alterMigrations,
		contract: contractMigrations,
	});

	const tables = await context.dbClient.introspection.getTables();
	assert.isUndefined(tables.find((t) => t.name === "users"));
	assert.isUndefined(tables.find((t) => t.name === "teams"));
	assert.isUndefined(tables.find((t) => t.name === "hello"));
});

test.skip<TestContext>("rollbacks all migration phases on error - concurrent index failure", async (context) => {
	const expandMigrations: ExpandPushMigration[] = [
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("users").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("users").execute();
			},
		},
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("teams").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("teams").execute();
			},
		},
		{
			type: ChangesetType.CreateTable,
			phase: ChangesetPhase.Expand,
			up: async (db: AnyKysely) => {
				await db.withSchema("public").schema.createTable("hello").execute();
			},
			down: async (db: AnyKysely) => {
				await db.withSchema("public").schema.dropTable("hello").execute();
			},
		},
		{
			type: ChangesetType.CreateIndex,
			phase: ChangesetPhase.Expand,
			transaction: false,
			up: async (db: AnyKysely) => {
				try {
					await sql`${sql.raw('create index concurrently "users_3cf2733f_monolayer_idx" on "publkic"."users" ("name")')}`.execute(
						db,
					);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (error: any) {
					if (error.code === "23505") {
						await db
							.withSchema("public")
							.schema.dropIndex("users_3cf2733f_monolayer_idx")
							.ifExists()
							.execute();
					}
					throw error;
				}
			},
			down: async (db: AnyKysely) => {
				await db
					.withSchema("public")
					.schema.dropIndex("users_3cf2733f_monolayer_idx")
					.ifExists()
					.execute();
			},
		},
	];

	const pushMigrator = new PushMigrator({ db: context.dbClient });

	await pushMigrator.push({
		expand: expandMigrations,
	});

	const tables = await context.dbClient.introspection.getTables();

	assert.isUndefined(tables.find((t) => t.name === "users"));
	assert.isUndefined(tables.find((t) => t.name === "teams"));
	assert.isUndefined(tables.find((t) => t.name === "hello"));
});
