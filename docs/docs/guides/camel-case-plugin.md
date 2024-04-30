---
sidebar_position: 11
---

# Camel Case Plugin

[Kysely](https://kysely.dev) comes with a [camel case plugin](https://kysely.dev/docs/plugins#camel-case-plugin
) that converts snake_case identifiers in the database into camelCase in the javascript side.

To use this plugin with `monolayer`, you need to enable it in the `CamelCasePlugin` configuration property.

```ts title="configuration.ts"
import { type Configuration } from "monolayer/config";
import { dbSchema } from "./schema";

export default {
  schemas: [dbSchema],
  ...
  camelCasePlugin: {
    enabled: true,
  },
} satisfies Configuration;
```

[CamelCasePluginOptions](https://kysely-org.github.io/kysely-apidoc/interfaces/CamelCasePluginOptions.html) can be passed in the `CamelCasePlugin`.`options` property. Here's an example to enable [underscoreBeforeDigits](https://kysely-org.github.io/kysely-apidoc/interfaces/CamelCasePluginOptions.html#underscoreBeforeDigits):

```ts title="configuration.ts"
import { type Configuration } from "monolayer/config";
import { dbSchema } from "./schema";

export default {
  schemas: [dbSchema],
  ...
  camelCasePlugin: {
    enabled: true,
    options: {
      underscoreBeforeDigits: true,
    },
  },
} satisfies Configuration;
```
