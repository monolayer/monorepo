import { expect, test } from "vitest";
import { sortTableDependencies } from "./dependencies.js";

test("sort dependencies", () => {
	const tablesToRename = [
		{ from: "public.users", to: "public.new_users" },
		{ from: "public.posters", to: "public.new_posters" },
		{ from: "public.books", to: "public.new_books" },
	];

	const dbDependencies = ["users", "videos", "posters", "books"];

	const localDependencies = [
		"users",
		"videos",
		"posters",
		"books",
		"buildings",
	];

	const expected = [
		"users",
		"new_users",
		"videos",
		"posters",
		"new_posters",
		"books",
		"new_books",
		"buildings",
	];

	expect(
		sortTableDependencies(
			dbDependencies,
			localDependencies,
			tablesToRename,
			"public",
		),
	).toEqual(expected);
});
