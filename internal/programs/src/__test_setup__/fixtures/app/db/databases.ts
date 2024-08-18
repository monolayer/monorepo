import { defineDatabase } from "@monorepo/pg/database.js";
import { dbSchema } from "./schema.js";

export default defineDatabase({
	id: "default",
	schemas: [dbSchema],
});

export const stats = defineDatabase({ id: "stats", schemas: [] });
