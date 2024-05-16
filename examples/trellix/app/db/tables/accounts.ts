import { sql } from "kysely";
import { index, primaryKey, table, text, unique, uuid } from "monolayer/pg";

export const accounts = table({
  columns: {
    id: uuid().default(sql`gen_random_uuid()`),
    email: text().notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    unique: [unique(["email"])],
  },
  indexes: [index(["email"])],
});
