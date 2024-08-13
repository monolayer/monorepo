---
sidebar_position: 2
---

# Columns

Each column in a table has a data type that will constrain the set of possible values that can be assigned it. For example a column with an `integer` data type will not accept text strings, and the data stored in such a column can be used for mathematical computations.

Depending on the data type, the column can be used for different computations (mathematical, text manipulation, etc).
Most of the data types in PostgreSQL have a corresponding column function in `monolayer`.

## bigint

Column that stores whole numbers.

```ts
import { bigint, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				// highlight-next-line
				id: bigint(),
			},
		}),
	},
});
```

## bigserial

Unique identifier column.

```ts
import { bigserial, table } from "monolayer/pg";

const users = table({
  columns: {
    id: bigserial(),
  },
});
```

## boolean

Column that stores booleans.

```ts
import { boolean, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				// highlight-next-line
				active: boolean(),
			},
		}),
	},
});
```

## bytea

Column that stores binary strings.

https://www.postgresql.org/docs/current/datatype-binary.html#DATATYPE-BINARY | bytea

```ts
import { schema, table, bytea } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				// highlight-next-line
				image: bytea(),
			},
		}),
	},
});
```

## character

Column that stores a fixed-length, blank-padded string of up to `maximumLength` characters.

https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | character

```ts
import { char, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				description: char(30),
			},
		}),
	},
});
```

## character varying

Column that stores variable-length string with an optional maximum length.

https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | character varying

```ts
import { characterVarying, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				name: characterVarying(),
			},
		}),
	},
});
```

## date

Column that stores dates (without time of day).

https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME | date

```ts
import { date, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				createdAt: date(),
			},
		}),
	},
});
```

## double precision

Column that stores inexact, variable-precision numeric types.

https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT | double precision

```ts
import { doublePrecision, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				value: doublePrecision(),
			},
		}),
	},
});
```

## integer

Column that stores whole numbers.

https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT | integer

```ts
import { integer, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				id: integer(),
			},
		}),
	},
});
```

## json

Column that stores JSON data.

https://www.postgresql.org/docs/current/datatype-json.html#DATATYPE-JSON | json

```ts
import { json, schema, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				document: json(),
			},
		}),
	},
});
```

## jsonB

Column that stores JSON data.

Data is stored in a decomposed binary format. Slower to input than a `json` column, but significantly faster to process.

```ts
import { json, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        document: json(),
      },
    }),
  },
});
```

## numeric

Column that can store numbers with a very large number of digits.

```ts
import { schema, numeric, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				amount: numeric(),
			},
		}),
	},
});
```

## real

Column that stores inexact, variable-precision numeric types.

https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT | real

```ts
import { schema, real, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        number: real(),
      },
    }),
  },
});
```

## serial

Unique identifier column.

https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL | serial

```ts
import { schema, serial, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				id: serial(),
			},
		}),
	},
});
```

## smallint

Column that stores small-range integers.

https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT | smallint

```ts
import { schema, smallint, table } from "monolayer/pg";

const dbSchema = schema({
	tables: {
		example: table({
			columns: {
				id: smallint(),
			},
		}),
	},
});
```

## text

Column that stores variable unlimited length strings.

https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | text

```ts
import { schema, table, text } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        description: text(),
      },
    }),
  },
});
```

## time

Column that stores times of day (no date) without time zone.

https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME | time without time zone

```ts
import { schema, table, time } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        start: time(),
      },
    }),
  },
});
```

## time with time zone

Column that stores times of day (no date) with time zone.

```ts
import { schema, table, timeWithTimeZone } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        start: timeWithTimeZone(),
      },
    }),
  },
});
```

## timestamp

Column that stores both date and time without time zone with an optional precision.

https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME |

```ts
import { schema, table, timestamp } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        createdAt: timestamp(),
      },
    }),
  },
});
```

## timestanp with time zone

Column that stores both date and time with time zone with an optional precision.

https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME | timestamp without time zone

```ts
import { schema, table, timestampWithTimeZone } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        createdAt: timestampWithTimeZone(),
      },
    }),
  },
});
```

## uuid

Column that stores Universally Unique Identifiers (UUID).

https://www.postgresql.org/docs/current/datatype-uuid.html#DATATYPE-UUID | uuid

```ts
import { uuid, schema, sql, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";
 *
const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        id: uuid().default(sql`gen_random_uuid()`),
      },
    }),
  },
});
```

## Other data types

Explain how to use genericColumn to add support for other data types

## Column defaults

## Not null constraints

See: [Not null constraints](./constraints/not-null-constraints)

## Other constraints

Other constraints (primary key, foreign keys, unique constraints, etc) are defined at the table level.
