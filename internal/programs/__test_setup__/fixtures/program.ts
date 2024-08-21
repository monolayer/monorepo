import dotenv from "dotenv";
import nunjucks from "nunjucks";
dotenv.config();

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
