import { sql } from "kysely";
import { table, uuid, text, primaryKey, foreignKey, unique, index } from "monolayer/pg";
import { accounts } from "./accounts.js";

export const passwords = table({
  columns: {
    id: uuid().default(sql`gen_random_uuid()`),
    salt: text().notNull(),
    hash: text().notNull(),
    accountId: uuid().notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [foreignKey(["accountId"], accounts, ["id"])],
    unique: [unique(["accountId"])],
  },
  indexes: [index(["accountId"])],
});
