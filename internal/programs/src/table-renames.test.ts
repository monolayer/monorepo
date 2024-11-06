import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { RenameState, tableRenames } from "~programs/table-renames.js";
import { pressKey } from "~test-setup/keys.js";

describe("tables to rename", { concurrent: false }, () => {
	test("returns an empty rename list when there are no added tables", async () => {
		const program = tableRenames({ added: [], deleted: ["users"] }, "public");
		const result = await Effect.runPromise(
			RenameState.provide(program, {
				tableRenames: [],
				columnRenames: undefined,
			}),
		);
		expect(result).toStrictEqual([]);
	});

	test("returns an empty rename list when there are no deleted tables", async () => {
		const program = tableRenames({ added: ["users"], deleted: [] }, "public");
		const result = await Effect.runPromise(
			RenameState.provide(program, {
				tableRenames: [],
				columnRenames: undefined,
			}),
		);
		expect(result).toStrictEqual([]);
	});

	test("returns an empty rename list when the selecting to create a table", async () => {
		const program = tableRenames(
			{ added: ["users"], deleted: ["accounts"] },
			"public",
		);
		const promise = Effect.runPromise(
			RenameState.provide(program, {
				tableRenames: [],
				columnRenames: undefined,
			}),
		);
		await pressKey("ENTER");

		const result = await promise;
		expect(result).toStrictEqual([]);
	});

	test("returns an empty rename list when the selecting to create tables", async () => {
		const program = tableRenames(
			{ added: ["users", "organizations"], deleted: ["accounts"] },
			"public",
		);
		const promise = Effect.runPromise(
			RenameState.provide(program, {
				tableRenames: [],
				columnRenames: undefined,
			}),
		);

		await pressKey("ENTER");
		await pressKey("ENTER");

		const result = await promise;

		expect(result).toStrictEqual([]);
	});

	test("user selects only added table to rename", async () => {
		const program = tableRenames(
			{ added: ["users"], deleted: ["accounts"] },
			"public",
		);
		const promise = Effect.runPromise(RenameState.provide(program));

		await pressKey("DOWN");
		await pressKey("ENTER");

		const result = await promise;

		expect(result).toStrictEqual([
			{ from: "public.accounts", to: "public.users" },
		]);
	});

	test("user selects first added table with only one option", async () => {
		const program = tableRenames(
			{ added: ["organizations", "users"], deleted: ["accounts"] },
			"public",
		);
		const promise = Effect.runPromise(RenameState.provide(program));

		await pressKey("DOWN");
		await pressKey("ENTER");

		const result = await promise;

		expect(result).toStrictEqual([
			{ from: "public.accounts", to: "public.organizations" },
		]);
	});

	test("user selects second added table to rename with only one option", async () => {
		const program = tableRenames(
			{ added: ["organizations", "users"], deleted: ["accounts"] },
			"public",
		);
		const promise = Effect.runPromise(RenameState.provide(program));

		await pressKey("ENTER");
		await pressKey("DOWN");
		await pressKey("ENTER");

		const result = await promise;

		expect(result).toStrictEqual([
			{ from: "public.accounts", to: "public.users" },
		]);
	});

	test("user selects first added table with among multiple options", async () => {
		const program = tableRenames(
			{
				added: ["organizations", "users"],
				deleted: ["accounts", "companies"],
			},
			"public",
		);
		const promise = Effect.runPromise(RenameState.provide(program));

		await pressKey("DOWN");
		await pressKey("ENTER");
		await pressKey("ENTER");

		const result = await promise;

		expect(result).toStrictEqual([
			{ from: "public.accounts", to: "public.organizations" },
		]);
	});

	test("user selects second added table to rename among multiple options", async () => {
		const program = tableRenames(
			{
				added: ["users", "organizations"],
				deleted: ["accounts", "companies"],
			},
			"public",
		);
		const promise = Effect.runPromise(RenameState.provide(program));

		await pressKey("ENTER");
		await pressKey("DOWN");
		await pressKey("DOWN");
		await pressKey("ENTER");

		const result = await promise;

		expect(result).toStrictEqual([
			{ from: "public.companies", to: "public.organizations" },
		]);
	});

	test("user selects all tables to rename among multiple options", async () => {
		const program = tableRenames(
			{
				added: ["users", "organizations"],
				deleted: ["accounts", "companies"],
			},
			"public",
		);
		const promise = Effect.runPromise(RenameState.provide(program));

		await pressKey("DOWN");
		await pressKey("ENTER");
		await pressKey("DOWN");
		await pressKey("ENTER");

		const result = await promise;

		expect(result).toStrictEqual([
			{ from: "public.accounts", to: "public.users" },
			{ from: "public.companies", to: "public.organizations" },
		]);
	});

	test("user does not select any added table to rename", async () => {
		const promise = Effect.runPromise(
			RenameState.provide(
				tableRenames({ added: ["users"], deleted: ["accounts"] }, "public"),
				{
					tableRenames: [],
					columnRenames: undefined,
				},
			),
		);
		await pressKey("ENTER");
		const result = await promise;
		expect(result).toStrictEqual([]);
		const anotherProgram = tableRenames(
			{ added: ["users", "organizations"], deleted: ["accounts"] },
			"public",
		);
		const anotherProgramPromise = Effect.runPromise(
			RenameState.provide(anotherProgram, {
				tableRenames: [],
				columnRenames: undefined,
			}),
		);
		await pressKey("ENTER");
		await pressKey("ENTER");
		const anotherProgramResult = await anotherProgramPromise;
		expect(anotherProgramResult).toStrictEqual([]);
	});

	test("user cancels selection fails with PromptCancelError", async () => {
		const program = Effect.runPromise(
			RenameState.provide(
				tableRenames(
					{ added: ["users_errors"], deleted: ["accounts"] },
					"public",
				),
				{
					tableRenames: [],
					columnRenames: undefined,
				},
			).pipe(Effect.catchAll((error) => Effect.succeed(error))),
		);
		await pressKey("CONTROLC");
		expect(await program).toStrictEqual([]);
	});
});
