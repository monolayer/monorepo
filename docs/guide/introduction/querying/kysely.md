# Querying with Kysely

Now that we've have a the database, we are ready to start querying the database!

`monolayer` provides you out-of-the box with a type-safe [`kysely`](https://kysely.dev) database client.

::: info
If you are using [`Prisma`](https://www.prisma.io) jump to [querying with Prisma](./prisma.md).
:::

To query the database, we'll use the default database client that `create-monolayer` put in `db/client.ts`.

In the same folder where the `db` folder is located, create a new file named `example.ts` and add the following code to it:

```ts
import { defaultDbClient } from "./db/client.js";
import { jsonArrayFrom } from "kysely/helpers/postgres";

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

// Disconnect client from the database
await defaultDbClient.destroy();
```

In this script we'll:
- Delete all `posts` and `users`.
- Create a `user` with a `post`.
- Query for all `users` and their posts.
- Output the result.


To run the script, run following command from your project root (*replace the path with the actual path to `example.ts`*) :

```bash
npx tsx path/to/example.ts
```

You should get this output:

```text
[
  {
    name: 'John Smith',
    email: 'js@example.com',
    posts: [
      {
        title: 'Sample',
        content: 'Hello World!',
        published: false,
      }
    ]
  }
]
```
