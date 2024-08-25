import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { gen, tryPromise } from "effect/Effect";
import { execa } from "execa";

const prismaDbPull = (schemaPath: string) =>
	execa("npx", ["prisma", "db", "pull", "--schema", schemaPath]);
const prismaGenerate = (schemaPath: string) =>
	execa("npx", ["prisma", "generate", "--schema", schemaPath]);

export const generatePrisma = spinnerTask("Generate prisma", () =>
	gen(function* () {
		const appEnv = yield* appEnvironment;
		if (appEnv.currentDatabase.generatePrismaSchema) {
			const schemaPath = appEnv.currentDatabase.prismaSchemaPath;
			yield* tryPromise(() => prismaDbPull(schemaPath));
			yield* tryPromise(() => prismaGenerate(schemaPath));
		}
		return true;
	}),
);
