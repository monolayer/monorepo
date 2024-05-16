import { defaultDb } from "~/db/db.js";

export async function deleteBoard(boardId: number, accountId: string) {
  return await defaultDb
    .deleteFrom("boards")
    .where("id", "=", boardId)
    .where("accountId", "=", accountId)
    .execute();
}

export async function createBoard(userId: string, name: string, color: string) {
  return await defaultDb
    .insertInto("boards")
    .values({ name, color, accountId: userId })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getHomeData(userId: string) {
  return await defaultDb
    .selectFrom("boards")
    .selectAll()
    .where("accountId", "=", userId)
    .execute();
}
