import {
  foreignKey,
  index,
  integer,
  primaryKey,
  table,
  text,
  timestampWithTimeZone,
  uuid,
} from "monolayer/pg";
import { sql } from "kysely";
import { accounts } from "./accounts";

export const boards = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    color: text().default("#e0e0e0").notNull(),
    createdAt: timestampWithTimeZone()
      .default(sql`now()`)
      .notNull(),
    accountId: uuid().notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [foreignKey(["accountId"], accounts, ["id"])],
  },
  indexes: [index(["accountId"])],
});
