import dotenv from "dotenv";
import path from "node:path";
import { cwd } from "node:process";
import nunjucks from "nunjucks";
dotenv.config();

const configurationPath = path.join(
	cwd(),
	"internal",
	"configuration",
	"src",
	"monolayer.js",
);

export const monolayerTemplate =
	nunjucks.compile(`import { defineConfig } from "${configurationPath}";

export default defineConfig({
	entryPoints: {
		databases: "db/databases.ts",
		seed: "db/seed.ts",
	},
});
`);

export const configurationsTemplate =
	nunjucks.compile(`import { dbSchema } from "./schema";
import { defineDatabase } from "{{ pgPath }}";

export default defineDatabase({
  id: "default",
	schemas: [dbSchema],
});

export const stats = defineDatabase({id: "stats"});
`);

export const configurationsTemplateTwoDatabaseSchemas =
	nunjucks.compile(`import { dbSchema } from "./schema";
import { defineDatabase } from "{{ pgPath }}";
import { dbSchema as anotherDbSchema } from "./{{ secondSchemaFile }}";

export default defineDatabase({
  id: "default",
	schemas: [dbSchema, anotherDbSchema],
});

export const stats = defineDatabase({id: "stats"});
`);
