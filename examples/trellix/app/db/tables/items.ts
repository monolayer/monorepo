import {
  foreignKey,
  index,
  integer,
  primaryKey,
  real,
  table,
  text,
  uuid,
} from "monolayer/pg";
import { sql } from "kysely";
import { boards } from "./boards";
import { columns } from "./columns";

export const items = table({
  columns: {
    id: uuid().default(sql`gen_random_uuid()`),
    title: text().notNull(),
    content: text(),
    order: real().notNull(),
    columnId: uuid().notNull(),
    boardId: integer().notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [
      foreignKey(["boardId"], boards, ["id"])
        .deleteRule("cascade")
        .updateRule("cascade"),
      foreignKey(["columnId"], columns, ["id"])
        .deleteRule("cascade")
        .updateRule("cascade"),
    ],
  },
  indexes: [index(["columnId"]), index(["boardId"])],
});
