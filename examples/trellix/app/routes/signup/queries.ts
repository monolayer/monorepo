import crypto from "crypto";
import { defaultDb } from "~/db/db.js";

export async function accountExists(email: string) {
  const account = await defaultDb
    .selectFrom("accounts")
    .select("id")
    .where("email", "=", email)
    .executeTakeFirst();
  return Boolean(account);
}

export async function createAccount(email: string, password: string) {
  let salt = crypto.randomBytes(16).toString("hex");
  let hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha256")
    .toString("hex");

  return await defaultDb.transaction().execute(async (trx) => {
    const account = await trx
      .insertInto("accounts")
      .values({ email })
      .returning("id")
      .executeTakeFirstOrThrow();
    await trx
      .insertInto("passwords")
      .values({ salt, hash, accountId: account.id })
      .execute();
    return account;
  });
}
