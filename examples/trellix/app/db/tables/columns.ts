import {
  doublePrecision,
  foreignKey,
  index,
  integer,
  primaryKey,
  table,
  text,
  uuid,
} from "monolayer/pg";
import { sql } from "kysely";
import { boards } from "./boards";

export const columns = table({
  columns: {
    id: uuid().default(sql`gen_random_uuid()`),
    name: text().notNull(),
    boardId: integer().notNull(),
    order: doublePrecision().default(0).notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [
      foreignKey(["boardId"], boards, ["id"])
        .deleteRule("cascade")
        .updateRule("cascade"),
    ],
  },
  indexes: [index(["boardId"])],
});
