import { appEnvironment } from "@monorepo/state/app-environment.js";
import { gen, tryPromise } from "effect/Effect";
import { execa } from "execa";
import ora from "ora";
import color from "picocolors";

const prismaDbPull = (schemaPath: string) =>
	execa("npx", ["prisma", "db", "pull", "--schema", schemaPath]);
const prismaGenerate = (schemaPath: string) =>
	execa("npx", ["prisma", "generate", "--schema", schemaPath]);

export const generatePrisma = gen(function* () {
	const appEnv = yield* appEnvironment;
	if (appEnv.currentDatabase.generatePrismaSchema) {
		const spinner = ora();
		spinner.start("Generate prisma schema");
		const start = performance.now();
		const schemaPath = appEnv.currentDatabase.prismaSchemaPath;
		yield* tryPromise(() => prismaDbPull(schemaPath));
		yield* tryPromise(() => prismaGenerate(schemaPath));
		const end = performance.now();
		spinner.succeed(
			`Generate prisma schema ${color.gray(`${Number(end - start).toFixed(3)}ms`)}`,
		);
	}
	return true;
});
