import crypto from "crypto";
import { defaultDb } from "~/db/db.js";
import { type ExpressionBuilder } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import type { DB } from "~/db/schema.js";

export async function login(email: string, password: string) {
  let user = await defaultDb
    .selectFrom("accounts")
    .selectAll()
    .where("email", "=", email)
    .select((eb) => [userPassword(eb)])
    .executeTakeFirst();

  if (user === undefined || user.password === null) {
    return false;
  }

  let hash = crypto
    .pbkdf2Sync(password, user.password.salt, 1000, 64, "sha256")
    .toString("hex");

  if (hash !== user.password.hash) {
    return false;
  }

  return user.id;
}

function userPassword(
  eb: ExpressionBuilder<DB, "accounts">,
) {
  return jsonObjectFrom(
    eb
      .selectFrom("passwords")
      .select(["passwords.hash", "passwords.salt"])
      .whereRef("passwords.accountId", "=", "accounts.id"),
  ).as("password");
}
