# Querying with Prisma

::: info
This tutorial expects some familiarity with [`Prisma`](https://www.prisma.io). Please refer to the [Prisma docs](https://www.prisma.io/docs) if you need assistance on how to use it.
:::

`monolayer-pg` can be integrated with `Prisma`.

You can combine `monolayer-pg`(*schema definition in TypeScript and migration capabilities*) with the `Prisma`(*easy to use ORM*).

## Installing Prisma

From the root of your project, install Prisma, the Prisma client, and initialize Prisma with:

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

## Adapt configurations

In your `.env` file change the value of `DATABASE_URL` (*inserted by Prisma*) to value of `MONO_PG_DEFAULT_DATABASE_URL`.

::: warning
Don't delete the `MONO_PG_DEFAULT_DATABASE_URL` variable.
:::

Then, adjust the database definition in `databases.ts` to generate the Prisma schema:

```ts
export default defineDatabase({
  schemas: [dbSchema],
  extensions: [extension("moddatetime")],
  camelCase: false,
  seeder: dbSeed,
  generatePrismaSchema: true, // [!code ++]
});
```

## Generate the Prisma client

`monolayer-pg` generates the Prisma client after applying migrations.

Since `Prisma` was not configured the first time we applied migrations, we need to run the command again:

```bash
npx monolayer migrations apply --phase all
```

You should get the following output:

<<< @/snippets/migrations-prisma.txt

::: tip How does it work?
After applying migrations, `monolayer-pg` executes [`prisma db pull`](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#db-pull) and [`prisma generate`](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#generate) on your behalf.

`Prisma` will automatically generate relationships between your models based on the relations established in the database through foreign keys.
:::

## Querying the database

In the same folder where the `db` folder is located, create a new file named `example-prisma.ts` and add the following code to it:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.posts.deleteMany();
  await prisma.users.deleteMany();
  await prisma.users.create({
    data: {
      name: "John Smith",
      email: "js@example.com",
      posts: {
        create: { title: "Sample", content: "Hello World" },
      },
    },
  });
  const allUsers = await prisma.users.findMany({
    select: {
      name: true,
      email: true,
      posts: {
        select: {
          title: true,
          content: true,
          published: true,
        },
      },
    },
  });
  console.dir(allUsers, { depth: 3 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

In this script we'll:

- Delete all `posts` and `users`.
- Create a `user` with a `post`.
- Query for all `users` and their posts.
- Output the result.

To run the script, run following command from your project root (*replace the path with the actual path to `example-prisma.ts`*) :

```bash
npx tsx path/to/example-prisma.ts
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
