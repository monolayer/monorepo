---
sidebar_position: 12
---

# Extensions

monolayer manages extensions through the `extensions` property in your configuration.

The default configuration imports the list of extensions from the `extensions.ts` file.

<Tabs>
  <TabItem value="configuration.ts" label="configuration.ts" default>
```ts title="configuration.ts"
import { type Configuration } from "monolayer/config";
import { dbSchema } from "./schema";
import { dbExtensions } from "./extensions";

export default {
  ...
  extensions: dbExtensions,
  ...
} satisfies Configuration;
```
  </TabItem>
  <TabItem value="extensions.ts" label="extensions.ts" default>
```ts title="extensions.ts"
export const dbExtensions = [];
```
  </TabItem>
</Tabs>

When monolayer generates migrations, extensions will be added, kept, and removed according to the contents of the `extensions` and what the database currently has installed:
- Added: when the extension is in your configuration but not in the database.
- Kept: when the extension is in your configuration and in the database.
- Removed: when the extension is the database but not in your configuration.

## Adding extensions

Add the desired extension to the `dbExtensions` array in the `extensions.ts` file:

```ts title="extensions.ts"
import { extension } from "monolayer/pg";

export const dbExtensions = [extension("moddatetime")]
```

Generate a migration and migrate with:
```bash
npx monolayer sync
```

:::note
When adding extensions that are not part of the [default PostgreSQL installation](https://www.postgresql.org/docs/current/contrib.html)
you need to make sure they are installed in the PostgreSQL server before running the migration.
:::

:::note
Some extensions need a user with superuser privileges to load them into the database. You should check the extension documentation accordingly.
:::

## Removing extensions

Remove the desired extension from the `dbExtensions` array in the `extensions.ts` file:

<Tabs>
  <TabItem value="before" label="Before" default>
```ts title="extensions.ts"
import { extension } from "monolayer/pg";

export const dbExtensions = [extension("moddatetime")]
```
  </TabItem>
  <TabItem value="after" label="After" default>
```ts title="extensions.ts"
export const dbExtensions = [];
```
  </TabItem>
</Tabs>

Generate a migration and migrate with:
```bash
npx monolayer sync
```