# Column Data Types

Each [column](./../glossary.md#column) in a [table](./../glossary.md#table) has a data type that will constrain the set of possible values that can be assigned it. For example a column with an `integer` data type will not accept text strings, and the data stored in such a column can be used for mathematical computations.

You define a column with functions from `@monolayer/pg/schema`.

The most common data types in PostgreSQL are supported.

## bigint

Column that stores whole numbers.

```ts
import { bigint, table } from "@monolayer/pg/schema";

const example = table({
  columns: {
   id: bigint(), // [!code highlight]
  },
})
```

## bigserial

Unique identifier column.

```ts
import { bigserial, table } from "@monolayer/pg/schema";

const example = table({
  columns: {
    id: bigserial(),
  },
});
```

::: warning
Use [identity](#identity-columns) columns instead of `bigserial`.

Read more in: [Don't use serial](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_serial)
:::

## boolean

Column that stores booleans.

```ts
import { boolean, table } from "@monolayer/pg/schema";

const users = table({
  columns: {
    active: boolean(), // [!code highlight]
	},
});
```

## bytea

Column that stores binary strings.

```ts
import { bytea, table } from "@monolayer/pg/schema";

const users = table({
  columns: {
    image: bytea(), // [!code highlight]
  },
});
```

## char

Alias of [character](#character)

```ts
import { char, table } from "@monolayer/pg/schema";

const dbSchema = table({
  columns: {
    description: char(30), // [!code highlight]
  },
});
```

::: warning
Don't use `char` for a column. You probably want [text](#text).

Read more in:
- [Don't use char(n)](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_char.28n.29)
- [Don't char(n) event for fixed length identifiers](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_char.28n.29_even_for_fixed-length_identifiers)
:::


## character

Column that stores a fixed-length, blank-padded string of up to maximum length of characters.

```ts
import { character, table } from "@monolayer/pg/schema";

const dbSchema = table({
  columns: {
    description: character(30), // [!code highlight]
  },
});
```

::: warning
Don't use `character` for a column. You probably want [text](#text).

Read more in:
- [Don't use char(n)](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_char.28n.29)
- [Don't char(n) event for fixed length identifiers](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_char.28n.29_even_for_fixed-length_identifiers)
:::

## character varying

Column that stores variable-length string with an optional maximum length.

```ts
import { characterVarying, table } from "@monolayer/pg/schema";

const dbSchema = table({
  columns: {
    name: characterVarying(), // [!code highlight]
    description: characterVarying(255), // [!code highlight]
  },
});
```

::: warning
Don't use `characterVarying` with a maximum length for a column. Use `characterVarying` without limit or [text](#text).

Read more in: [Don't use varchar](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_varchar.28n.29_by_default)
:::

## date

Column that stores dates (without time of day).

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-datetime.html)

```ts
import { date, table } from "@monolayer/pg/schema";

const users = table({
  columns: {
    createdAt: date(), // [!code highlight]
  },
});
```

## double precision

Column that stores inexact, variable-precision numeric types.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT)

```ts
import { doublePrecision, table } from "@monolayer/pg/schema";

const books = table({
  columns: {
    price: doublePrecision(), // [!code highlight]
  },
});
```

## integer

Column that stores whole numbers.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT)

```ts
import { integer, table } from "@monolayer/pg/schema";

const users: table({
  columns: {
    id: integer(), // [!code highlight]
  },
});
```

## json

Column that stores JSON data.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-json.html#DATATYPE-JSON)

```ts
import { json, table } from "@monolayer/pg/schema";

const users = table({
  columns: {
    document: json(), // [!code highlight]
  },
});
```

## jsonB

Column that stores JSON data in a binary format. It's slower to input than a [`json`](#json) column, but significantly faster to process.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-json.html#DATATYPE-JSON)

```ts
import { jsonb, table } from "@monolayer/pg/schema";

const users = table({
  columns: {
    document: jsonb(), // [!code highlight]
  },
});
```

## numeric

Column that can store numbers with a very large number of digits iwth an optional maximum precision and scale.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL)

#### Unconstrained numeric

Numeric values of any length can be stored, up to the implementation limits.

```ts
import { numeric, table } from "@monolayer/pg/schema";

const items = table({
  columns: {
    amount: numeric(), // [!code highlight]
  },
});
```

#### Numeric with precision

Numeric values with a maximum number of digits to both sides of the decimal point.

*Example*: 23.5141 has a precision of 6.

```ts
import { numeric, table } from "@monolayer/pg/schema";

const items = table({
  columns: {
    amount: numeric(10), // [!code highlight]
  },
});
```

#### Numeric with precision and scale

Numeric with a:
- Maximum number of digits to both sides of the decimal point
- Maximum number of digits to the right of the decimal point.

*Example*: 23.5141 has precision of 6 and a scale of 4.

```ts
import { numeric, table } from "@monolayer/pg/schema";

const items = table({
  columns: {
    amount: numeric(6, 4), // [!code highlight]
  },
});
```

## real

Column that stores inexact, variable-precision numeric types with up to 6 decimal digits precision.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT)

```ts
import { real, table } from "@monolayer/pg/schema";
 *
const accounts = table({
  columns: {
    number: real(), // [!code highlight]
  },
});
```

## serial

Unique identifier column.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL)

```ts
import { serial, table } from "@monolayer/pg/schema";

const users = table({
  columns: {
    id: serial(),
  },
});
```

::: warning
Use [identity](#identity-columns) columns instead of `bigserial`.

Read more in: [Don't use serial](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_serial)
:::

## smallint

Column that stores small-range integers (*-32768 to +32767*)

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT)

```ts
import { smallint, table } from "@monolayer/pg/schema";

const books = table({
  columns: {
    id: smallint(),
  },
});
```

## text

Column that stores variable unlimited length strings.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER)

```ts
import { table, text } from "@monolayer/pg/schema";

const books = table({
  columns: {
    description: text(),
  },
});
```

## time

Column that stores times of day (no date) without time zone.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME)

```ts
import { table, time } from "@monolayer/pg/schema";

const appointments = table({
  columns: {
    scheduledAt: time(),
  },
});
```

## time with time zone

Column that stores times of day (no date) with time zone.

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME)

```ts
import { schema, table, timeWithTimeZone } from "@monolayer/pg/schema";

const runs = table({
  columns: {
   start: timeWithTimeZone(),
  },
});
```

::: warning
Use [`timestamp with time zone`](#timestanp-with-time-zone) instead.

Read more in: [Don't use timetz](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timetz)
:::


## timestamp

Column that stores both date and time without time zone with an optional precision (up to 6).

The precision of a timestamp is the number of fractional digits in the seconds field. If no precision is specified in a constant specification, it defaults to the precision of the literal value (but not more than 6 digits).

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME)

```ts
import { table, timestamp } from "@monolayer/pg/schema";

const users = table({
  columns: {
    createdAt: timestamp(),
  },
});
```

#### Timestamp with precision

```ts
import { table, timestamp } from "@monolayer/pg/schema";

const users = table({
  columns: {
    createdAt: timestamp(4),
  },
});
```

::: warning
Use [timestamp with time zone](#timestanp-with-time-zone) instead.

Read more in: [Don't timestamp without time zone](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29)
:::

## timestamp with time zone

Column that stores both date and time with time zone with an optional precision.

The precision of a timestamp with time zone is the number of fractional digits in the seconds field. If no precision is specified in a constant specification, it defaults to the precision of the literal value (but not more than 6 digits).

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME)

```ts
import { table, timestampWithTimeZone } from "@monolayer/pg/schema";

const users = table({
  columns: {
    createdAt: timestampWithTimeZone(),
  },
});
```

#### Timestamp with precision

```ts
import { table, timestampWithTimeZone } from "@monolayer/pg/schema";

const users = table({
  columns: {
    createdAt: timestampWithTimeZone(4),
  },
});
```

## timetz

Alias of [`time with time zone`](#time-with-time-zone)

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME)

```ts
import { table, timetz } from "@monolayer/pg/schema";

const runs = table({
  columns: {
   start: timetz(),
  },
});
```

::: warning
Use [`timestamp with time zone`](#timestanp-with-time-zone) instead.

Read more in: [Don't use timetz](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timetz)
:::


## uuid

Column that stores Universally Unique Identifiers (UUID).

[PostgreSQL Docs](https://www.postgresql.org/docs/current/datatype-uuid.html#DATATYPE-UUID)

```ts
import { table, uuid } from "@monolayer/pg/schema";

const users = table({
  columns: {
    id: uuid(),
  },
});
```

## Other data types

To use other data types read [Other column data types](./other-data-types.md)
