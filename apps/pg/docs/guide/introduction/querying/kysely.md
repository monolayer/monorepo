# Querying with Kysely

Now that we've have a the database with some tables, we are ready to start querying it!

`monolayer-pg` provides you a type-safe [`kysely`](https://kysely.dev) database client out-of-the box.

::: info
If you are using [`Prisma`](https://www.prisma.io) jump to [querying with Prisma](./prisma.md).
:::

To query the database, we'll use the default database client that `create-pg` put in `db/client.ts`.

In the same folder where the `db` folder is located, create a new file named `example.ts` and add the following code to it:

```ts
import { defaultDbClient } from "./db/client";
import { jsonArrayFrom } from "kysely/helpers/postgres";

async function main() {
  // Delete all posts and users
  await defaultDbClient.deleteFrom("posts").execute();
  await defaultDbClient.deleteFrom("users").execute();

  // Create a users
  const user = await defaultDbClient
    .insertInto("users")
    .values({ name: "John Smith", email: "js@example.com" })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Create a post
  const samplePost = {
    title: "Sample",
    authorId: user.id,
    content: "Hello World!",
    published: false,
  };
  await defaultDbClient.insertInto("posts").values(samplePost).execute();

  // Query for all users and their posts
  const usersWithPosts = await defaultDbClient
    .selectFrom("users")
    .select(["name", "email"])
    .select((eb) => [
      jsonArrayFrom(
        eb
          .selectFrom("posts")
          .select(["title", "content", "published"])
          .whereRef("posts.authorId", "=", "users.id")
      ).as("posts"),
    ])
    .execute();

  // Log results
  console.dir(usersWithPosts, { depth: 3 });
}

main()
  .then(async () => {
    await defaultDbClient.destroy();
  })
  .catch(async (e) => {
    console.error(e);
    await defaultDbClient.destroy();
    process.exit(1);
  });
```

The script we'll:

- Delete all `posts` and `users`.
- Create a `user` with a `post`.
- Query for all `users` and their posts.
- Output the result.

Eun following command from your project root (*replace the path with the actual path to `example.ts`*):

```bash
npx tsx path/to/example.ts
```

The output you get shoud be similar to:

```text
[
  {
    name: 'John Smith',
    email: 'js@example.com',
    posts: [ { title: 'Sample', content: 'Hello World', published: false } ]
  }
]
```
