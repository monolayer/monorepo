import type { ExpressionBuilder, SelectQueryBuilder } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import { ItemMutation } from "./types";
import { defaultDb } from "~/db/db.js";
import type { DB } from "~/db/schema.js";

export async function deleteCard(id: string, accountId: string) {
  return await defaultDb
    .deleteFrom("items")
    .where("items.id", "=", id)
    .using("boards")
    .whereRef("items.boardId", "=", "boards.id")
    .where("boards.accountId", "=", accountId)
    .execute();
}

export async function getBoardData(boardId: number, accountId: string) {
  return await defaultDb
    .selectFrom("boards")
    .selectAll()
    .where("id", "=", boardId)
    .where("accountId", "=", accountId)
    .select((eb) => [boardItems(eb), boardColumns(eb)])
    .executeTakeFirstOrThrow();
}

export async function updateBoardName(
  boardId: number,
  name: string,
  accountId: string,
) {
  return await defaultDb
    .updateTable("boards")
    .where("boards.id", "=", boardId)
    .where("boards.accountId", "=", accountId)
    .set({ name })
    .execute();
}

export async function upsertItem(
  mutation: ItemMutation & { boardId: number },
  accountId: string,
) {
  return await defaultDb
    .with("item_board", (db) =>
      db
        .selectFrom("boards")
        .select(["boards.id"])
        .where("boards.id", "=", mutation.boardId)
        .fullJoin("accounts", "accounts.id", "boards.accountId")
        .where("boards.accountId", "=", accountId),
    )
    .insertInto("items")
    .values(({ selectFrom }) => ({
      ...mutation,
      boardId: selectFrom("item_board").select("item_board.id"),
    }))
    .onConflict((oc) =>
      oc.column("id").doUpdateSet(({ selectFrom }) => ({
        ...mutation,
        boardId: selectFrom("item_board").select("item_board.id"),
      })),
    )
    .executeTakeFirstOrThrow();
}

export async function updateColumnName(
  id: string,
  name: string,
  accountId: string,
) {
  return defaultDb
    .updateTable("columns")
    .from("boards")
    .whereRef("boards.id", "=", "columns.boardId")
    .innerJoin("accounts", "accounts.id", "boards.accountId")
    .where("boards.accountId", "=", accountId)
    .where("columns.id", "=", id)
    .set({ name })
    .execute();
}

export async function createColumn(
  boardId: number,
  name: string,
  id: string,
  accountId: string,
) {
  const count = await defaultDb
    .selectFrom("columns")
    .innerJoin("boards", "boards.id", "columns.boardId")
    .where("boardId", "=", boardId)
    .where("boards.accountId", "=", accountId)
    .select((eb) => eb.fn.count<number>("columns.id").as("columnCount"))
    .executeTakeFirstOrThrow();

  return await defaultDb
    .insertInto("columns")
    .values({
      id,
      boardId,
      name,
      order: count.columnCount + 1,
    })
    .execute();
}

function boardItems(eb: ExpressionBuilder<DB, "boards">) {
  return jsonArrayFrom(
    eb
      .selectFrom("items")
      .selectAll(["items"])
      .whereRef("items.boardId", "=", "boards.id"),
  ).as("items");
}

function boardColumns(eb: ExpressionBuilder<DB, "boards">) {
  return jsonArrayFrom(
    eb
      .selectFrom("columns")
      .selectAll(["columns"])
      .whereRef("columns.boardId", "=", "boards.id"),
  ).as("columns");
}
