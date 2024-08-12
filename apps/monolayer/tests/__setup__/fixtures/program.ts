import dotenv from "dotenv";
import nunjucks from "nunjucks";
dotenv.config();

export const monolayerTemplate = nunjucks.compile(`export default {
	folder: "db"
};
`);

export const configurationsTemplate =
	nunjucks.compile(`import { dbSchema } from "./schema";
import { defineDatabase } from "{{ pgPath }}";

export default defineDatabase({
	schemas: [dbSchema],
});

export const stats = defineDatabase({});
`);

export const configurationsTemplateTwoDatabaseSchemas =
	nunjucks.compile(`import { dbSchema } from "./schema";
import { defineDatabase } from "{{ pgPath }}";
import { dbSchema as anotherDbSchema } from "./{{ secondSchemaFile }}";

export default defineDatabase({
	schemas: [dbSchema, anotherDbSchema],
});

export const stats = defineDatabase({});
`);
