import { schema } from "monolayer/pg";
import { accounts } from "./tables/accounts.js";
import { passwords } from "./tables/passwords.js";
import { boards } from "./tables/boards.js";
import { columns } from "./tables/columns.js";
import { items } from "./tables/items.js";

export const dbSchema = schema({
  tables: {
    accounts,
    passwords,
    boards,
    columns,
    items,
  },
});

export type DB = typeof dbSchema.infer;
