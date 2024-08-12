import dotenv from "dotenv";
import nunjucks from "nunjucks";
dotenv.config();

export const monolayerTemplate = nunjucks.compile(`export default {
	folder: "db"
};
`);

export const configurationsTemplate =
	nunjucks.compile(`import { dbSchema } from "./schema";
import { defineConfig } from "{{ pgPath }}";

export default defineConfig({
	schemas: [dbSchema],
});

export const stats = defineConfig({});
`);

export const configurationsTemplateTwoDatabaseSchemas =
	nunjucks.compile(`import { dbSchema } from "./schema";
import { defineConfig } from "{{ pgPath }}";
import { dbSchema as anotherDbSchema } from "./{{ secondSchemaFile }}";

export default defineConfig({
	schemas: [dbSchema, anotherDbSchema],
});

export const stats = defineConfig({});
`);
