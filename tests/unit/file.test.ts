import { promises as fs } from "fs";
import mock from "mock-fs";
import { afterEach } from "node:test";
import color from "picocolors";
import { MockInstance, beforeEach, describe, expect, test, vi } from "vitest";
import { createDir, createFile } from "~/cli/components/file.js";

type TestContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	stdoutWriteSpy: MockInstance<any>;
};

describe("File actions", () => {
	beforeEach((context: TestContext) => {
		context.stdoutWriteSpy = vi.spyOn(process.stdout, "write");
		mock({
			"tmp/empty-dir": {},
			"some/dir": {
				"file.txt": "hello",
			},
		});
	});

	afterEach(() => {
		mock.restore();
	});

	describe("#createFile", () => {
		test("should create a file if it does not exist", async (context: TestContext) => {
			const path = "some/dir/foo.txt";
			expect(async () => {
				return await fs.stat(path);
			}).rejects.toThrowError();
			await createFile(path, "foo");
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(0);
			expect(fs.stat(path)).resolves.not.toThrowError();
			const contents = await fs.readFile(path, "utf8");
			expect(contents).toEqual("foo");
		});

		test("should not create a file if it already exists", async (context: TestContext) => {
			const path = "some/dir/file.txt";
			expect(fs.stat(path)).resolves.not.toThrowError();
			const stat = await fs.stat(path);
			await createFile(path, "foo");
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(0);
			expect(stat).toEqual(await fs.stat(path));
		});

		test("should optionally log a message when creating a new file", async (context: TestContext) => {
			const path = "some/dir/foo.txt";
			await createFile(path, "foo", true);
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(1);
			expect(context.stdoutWriteSpy).toHaveBeenCalledWith(
				`${color.gray("│")}  ${color.green("created")} ${path}\n`,
			);
		});

		test("should optionally log a message for an existing file", async (context: TestContext) => {
			const path = "some/dir/file.txt";
			await createFile(path, "foo", true);
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(1);
			expect(context.stdoutWriteSpy).toHaveBeenCalledWith(
				`${color.gray("│")}  ${color.yellow("exists")} ${path}\n`,
			);
		});
	});

	describe("#createDir", () => {
		test("should create a directory if it does not exist", async (context: TestContext) => {
			const path = "tmp/new-dir";
			expect(async () => {
				return await fs.stat(path);
			}).rejects.toThrowError();
			await createDir(path);
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(0);
			expect(fs.stat(path)).resolves.not.toThrowError();
		});

		test("should not create a directory if it already exists", async (context: TestContext) => {
			const path = "tmp/empty-dir";
			expect(fs.stat(path)).resolves.not.toThrowError();
			const stat = await fs.stat(path);
			await createDir(path);
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(0);
			expect(stat).toEqual(await fs.stat(path));
		});

		test("should optionally log a message when creating a new directory", async (context: TestContext) => {
			await createDir("tmp/new-dir", true);
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(1);
			expect(context.stdoutWriteSpy).toHaveBeenCalledWith(
				`${color.gray("│")}  ${color.green("created")} tmp/new-dir\n`,
			);
		});

		test("should optionally log a message for an existing directory", async (context: TestContext) => {
			await createDir("tmp/empty-dir", true);
			expect(context.stdoutWriteSpy).toHaveBeenCalledTimes(1);
			expect(context.stdoutWriteSpy).toHaveBeenCalledWith(
				`${color.gray("│")}  ${color.yellow("exists")} tmp/empty-dir\n`,
			);
		});
	});
});
