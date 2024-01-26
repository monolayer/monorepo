import { mkdirSync, rmdirSync } from "fs";
import { execaSync } from "execa";
import { cwd } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

type CliTestContext = {
	appFolder: string;
	task: {
		name: string;
	};
};

describe("CLI", () => {
	beforeEach(async (context: CliTestContext) => {
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
	});

	test("kinetic installs and exits with success", (context: CliTestContext) => {
		const { exitCode } = execaSync("npx", ["kinetic"], {
			cwd: context.appFolder,
		});
		expect(exitCode).toBe(0);
	});
});
