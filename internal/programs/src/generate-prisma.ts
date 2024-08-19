import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { tap, tryPromise } from "effect/Effect";
import { execa } from "execa";

const prismaDbPull = () => execa("npx", ["prisma", "db", "pull"]);
const prismaGenerate = () => execa("npx", ["prisma", "generate"]);

export const generatePrisma = spinnerTask("Generate prisma", () =>
	tryPromise(prismaDbPull).pipe(tap(tryPromise(prismaGenerate))),
);
