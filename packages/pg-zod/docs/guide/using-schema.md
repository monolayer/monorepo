# Validating Schemas

Generaate `Zod` schemas for tables declared with `@monolayer/pg` with the  [`zodSchema`](./../api/functions/zodSchema.md) function and parse data with the schema.

```ts
import {
  integer,
  primaryKey,
  table,
  text,
  timestampWithTimeZone
} from "@monolayer/pg/schema"
import { zodSchema } from "@monolayer/pg-zod"

// `users` table
const userRole = enumType("user_role", ["admin", "user"]);
const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    name: text(),
    email: text().notNull(),
    role: enumerated(userRole).notNull(),
    createdAt: timestampWithTimeZone().default(sql`now`).notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
  },
});

// Zod Schema for `users`
const schema = zodSchema(users);

// Usage
const user = schema.parse({
  name: "John Smith",
  email: 'john@smith.com',
  role: 'admin',
});

type InputType = z.input<typeof schema>;
//{
//   id: never;
//   name?: string | null | undefined;
//   email: string;
//   role: "user" | "admin";
//   createdAt?: Date | string | undefined;
//}

type OutputType = z.output<typeof schema>;
//{
//   id: never;
//   name?: string | null | undefined;
//   email: string;
//   role: "user" | "admin";
//   createdAt?: Date | undefined;
// }

```

## Extending Schemas

You can use the `Zod` API to customize schemas.

### Example

Adding an email validation to the `email` column in the `users` table from the [previous example](#validating-schemas):

```ts
const schema = zodSchema(users);

const schemaWithEmailValidation = schema.extend({
  email: schema.shape.email.pipe(z.string().email())
})
```

See: [Zod Objects](https://zod.dev/?id=objects)
