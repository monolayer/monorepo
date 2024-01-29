import { mkdirSync, rmdirSync } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { execaSync } from "execa";
import { MockSTDIN, stdin } from "mock-stdin";
import { cwd } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	configTemplate,
	kyselyTemplate,
	schemaTemplate,
} from "~/cli/components/init_folders_and_files.js";
import { npmInstall, npmList, npx } from "~/cli/utils/npm.js";
import { keys } from "~tests/helpers/key_codes.js";

type CliTestContext = {
	appFolder: string;
	task: {
		name: string;
	};
	io: MockSTDIN;
};

describe("kinetic CLI", () => {
	beforeEach(async (context: CliTestContext) => {
		context.io = stdin();
		context.appFolder = `${cwd()}/tmp/${context.task.name.replace(/ /g, "-")}`;
		mkdirSync(context.appFolder, { recursive: true });
		execaSync("cp", [
			`${cwd()}/tests/fixtures/app-cli/package.json`,
			context.appFolder,
		]);
		execaSync("npm", ["install"], {
			cwd: context.appFolder,
		});
		execaSync("npm", ["install", `${cwd()}/build/kysely-kinetic-1.0.0.tgz`], {
			cwd: context.appFolder,
		});
	});

	afterEach(async (context: CliTestContext) => {
		rmdirSync(context.appFolder, { recursive: true });
		context.io.restore();
	});

	test("installs and exits with success", async (context: CliTestContext) => {
		const result = await npx(["kinetic"], context.appFolder);
		expect(result.exitCode).toBe(0);
	});

	describe("init command", () => {
		test("installs dependencies in the project when missing", async (context: CliTestContext) => {
			const result = npx(["kinetic", "init"], context.appFolder);
			if (result.stdout !== null) {
				result.stdout.on("data", (data: Buffer | string) => {
					const read = data instanceof Buffer ? data.toString() : data;
					if (read.includes("Where should the db folder be created?")) {
						if (result.stdin !== null) {
							result.stdin.write(keys.enter);
						}
					}
				});
			}
			await result;
			expect(result.exitCode).toBe(0);

			const kyselyListCommand = await npmList(["kysely"], context.appFolder);
			expect(kyselyListCommand.value?.exitCode).toBe(0);

			const pgListCommand = await npmList(["pg"], context.appFolder);
			expect(pgListCommand.value?.exitCode).toBe(0);

			const pgTypesListCommand = await npmList(
				["@types/pg"],
				context.appFolder,
			);
			expect(pgTypesListCommand.value?.exitCode).toBe(0);
		}, 20000);

		test("skips install of dependecies already in the project", async (context: CliTestContext) => {
			await npmInstall(["kysely@0.27.0"], context.appFolder);
			await npmInstall(["pg@8.10.0"], context.appFolder);
			await npmInstall(["@types/pg@8.10.9"], context.appFolder);

			const result = npx(["kinetic", "init"], context.appFolder);
			if (result.stdout !== null) {
				result.stdout.on("data", (data: Buffer | string) => {
					const read = data instanceof Buffer ? data.toString() : data;
					if (read.includes("Where should the db folder be created?")) {
						if (result.stdin !== null) {
							result.stdin.write(keys.enter);
						}
					}
				});
			}

			await result;

			expect(result.exitCode).toBe(0);

			const listCommand = await npmList(
				[
					"kysely",
					"pg",
					"@types/pg",
					"--json",
					"--omit",
					"dev",
					"--omit",
					"peer",
				],
				context.appFolder,
			);
			const stdout = listCommand.value?.stdout;
			expect(JSON.parse(stdout ? stdout.toString() : "")).toMatchObject({
				dependencies: {
					kysely: {
						version: "0.27.0",
					},
					pg: {
						version: "8.10.0",
					},
					"@types/pg": {
						version: "8.10.9",
					},
				},
			});
			expect(listCommand.value?.exitCode).toBe(0);
		});

		test("initializes config and db in default folder", async (context: CliTestContext) => {
			const result = npx(["kinetic", "init"], context.appFolder);
			if (result.stdout !== null) {
				result.stdout.on("data", (data: Buffer | string) => {
					const read = data instanceof Buffer ? data.toString() : data;
					if (read.includes("Where should the db folder be created?")) {
						if (result.stdin !== null) {
							result.stdin.write(keys.enter);
						}
					}
				});
			}
			await result;

			expect(result.exitCode).toBe(0);
			expect(
				fs.readFile(path.join(context.appFolder, "kinetic.ts"), "utf8"),
			).resolves.toMatch(configTemplate.render({ folder: "app/db" }));
			expect(
				fs.readFile(path.join(context.appFolder, "app/db/schema.ts"), "utf8"),
			).resolves.toMatch(schemaTemplate.render());
			expect(
				fs.readFile(path.join(context.appFolder, "app/db/kysely.ts"), "utf8"),
			).resolves.toMatch(
				kyselyTemplate.render({ kineticConfigPath: "../../kinetic.js" }),
			);
			expect(
				fs.stat(path.join(context.appFolder, "app/db")),
			).resolves.not.toThrowError();
			expect(
				fs.stat(path.join(context.appFolder, "app/db/migrations")),
			).resolves.not.toThrowError();
		});

		test("initializes config and db in custom folder", async (context: CliTestContext) => {
			const result = npx(["kinetic", "init"], context.appFolder);
			if (result.stdout !== null) {
				result.stdout.on("data", (data: Buffer | string) => {
					const read = data instanceof Buffer ? data.toString() : data;
					if (read.includes("Where should the db folder be created?")) {
						if (result.stdin !== null) {
							result.stdin.write(`src/db${keys.enter}`);
						}
					}
				});
			}
			await result;

			expect(result.exitCode).toBe(0);
			expect(
				fs.readFile(path.join(context.appFolder, "kinetic.ts"), "utf8"),
			).resolves.toMatch(configTemplate.render({ folder: "src/db" }));
			expect(
				fs.readFile(path.join(context.appFolder, "src/db/schema.ts"), "utf8"),
			).resolves.toMatch(schemaTemplate.render());
			expect(
				fs.readFile(path.join(context.appFolder, "src/db/kysely.ts"), "utf8"),
			).resolves.toMatch(
				kyselyTemplate.render({ kineticConfigPath: "../../kinetic.js" }),
			);
			expect(
				fs.stat(path.join(context.appFolder, "src/db")),
			).resolves.not.toThrowError();
			expect(
				fs.stat(path.join(context.appFolder, "src/db/migrations")),
			).resolves.not.toThrowError();
		});
	});
});
