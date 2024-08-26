import { Effect } from "effect";
import { execa } from "execa";
import { expect, test, vi } from "vitest";
import { generatePrisma } from "~programs/generate-prisma.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

test.fails<TestProgramContext>(
	"generatePrisma runs 'prisma db pull' and 'prisma generate'",
	async (context) => {
		const mockedExeca = vi.mocked(execa);

		await Effect.runPromise(runProgram(generatePrisma, context));

		// expect(mockedExeca).toBeCalledTimes(2);
		expect(mockedExeca).toHaveBeenNthCalledWith(1, "npx", [
			"prisma",
			"db",
			"pull",
			"--schema",
			"prisma/schema.prisma",
		]);
		expect(mockedExeca).toHaveBeenNthCalledWith(2, "npx", [
			"prisma",
			"generate",
		]);
		expect(context.logMessages).toMatchInlineSnapshot(`
			[
			  "[?25l",
			  "│
			",
			  "[999D",
			  "[J",
			  "◇  Generate prisma ✓
			",
			  "[?25h",
			]
		`);
	},
);
