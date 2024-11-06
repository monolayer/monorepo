---
aside: true
---

# Column Validations

## bigint

Validations:

- Explicit `undefined` values are rejected.
- Value must be a valid `bigint`.
- Value cannot be lower than -9223372036854775808.
- Value cannot be greater than 9223372036854775807.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

::: code-group

```ts[types]
{
  input?: bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```

:::

## bigserial

- Explicit `undefined` values are rejected.
- Value must be a valid `bigint`.
- Value cannot be lower than -9223372036854775808.
- Value cannot be greater than 9223372036854775807.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: bigint | number | string | undefined;
  output?: string | undefined;
}
```

## bit

- Explicit `undefined` values are rejected.
- Value must be a string of 1's and 0's.
- Value must match the `fixedLength` exactly.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## bit varying

- Explicit `undefined` values are rejected.
- Value must be a string.
- Value can contain only 1 and 0.
- Value cannot exceed `maximumLength`.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## boolean

- Explicit `undefined` values are rejected.
- Value must be `boolean` or `Boolish`.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: boolean | Boolish | null | undefined;
  output?: boolean | null | undefined;
}
```

## bytea

- Explicit `undefined` values are rejected.
- Value must be a `Buffer`, `string`, or `null`.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: Buffer | string | null | undefined;
  output?: Buffer | string | null | undefined;
}
```

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

::: info
Since [Buffer](https://nodejs.org/api/buffer.html) is a Node.js API, the schema will not coerce the input to Buffer for browser compatibility.
:::

## character

- Explicit `undefined` values are rejected.
- Value must be a `string` or `null`.
- String values cannot exceed `maximumLength`.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## character varying

- Value must be a `string` or `null`.
- Value cannot exceed `maximumLength` (when specified).

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## cidr

- Explicit `undefined` values are rejected.
- Value must be `string` or `null`.
- String values must be a valid IPv4 or IPv6 network specification without bits set to the right of the mask.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## date

- Value must be `Date`, `string`, or `null`.
- Explicit `undefined` values are rejected.
- String values must be coercible to `Date`.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: Date | string | null | undefined;
  output?: Date | null | undefined;
}
```

## double precision

- Input value must be `bigint`, `number`, `string`, or `null`.
- Explicit `undefined` values are rejected.
- Non-null values must be either:
  - Coercible to BigInt.
  - `NaN`
  - `Infinity`
  - `-Infinity`.
- Bigint values must be:
  - Lower than -1e308.
  - Greater than 1e308.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```

## enum types

- Explicit `undefined` values are rejected.
- Input values must be an enum value, or `null`.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
// enumType("role", ["admin", "user"]);
{
  input?: "admin" | "user" | null | undefined;
  output?: "admin" | "user" | null | undefined;
}
```

## inet

- Explicit `undefined` values are rejected.
- Value must be `string` or `null`.
- String values must be a valid IPv4 or IPv6 host address with optional subnet.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## integer

- Input value must be `number`, `string`, or `null`.
- Non-null values must be:
  - Coercible to `number`.
  - Greater or equal than -2147483648.
  - Less than 2147483647.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: number | string | null | undefined;
  output?: number | null | undefined;
}
```

## json

- Explicit `undefined` values are rejected.
- Input values must be `JsonValue` or `null`.
- String values must be valid JSON.
- Record values must be convertible to a JSON string.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
// type JsonArray = JsonValue[];
// type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
{
  input?: JsonValue | null | undefined;
  output?: JsonValue | null | undefined;
}
```

## jsonb

- Explicit `undefined` values are rejected.
- Input values must be `JsonValue` or `null`.
- String values must be valid JSON.
- Record values must be convertible to a JSON string.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
// type JsonArray = JsonValue[];
// type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
{
  input?: JsonValue | null | undefined;
  output?: JsonValue | null | undefined;
}
```

## macaddr

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.
- String values must be a valid MAC address.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## macaddr8

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.
- String values must be a valid MAC address in EUI-64 format.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

## numeric

- Explicit `undefined` values are rejected.
- Input value must be `bigint`, `number`, `string`, or `null`.
- Non-null values must be either:
  - Coercible to a number.
  - NaN, Infinity, -Infinity
- Precision and scale are enforced when specified.

```ts
{
  input?:  bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

## real

- Explicit `undefined` values are rejected.
- Input value must be `number`, `string`, or `null`.
- Non-null values must be either:
  - coercible to `number`.
  - `NaN`, `Infinity`, or `-Infinity`.
- `number` values:
  - Cannot be lower than -1e37.
  - Cannot be greater than 1e37.

```ts
{
  input?:  bigint | number | string | null | undefined;
  output?: number | null | undefined;
}
```

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

## serial

- Explicit `undefined` values are rejected.
- Value must be a valid `number`.
- Value cannot be lower than -2147483648.
- Value cannot be greater than 2147483647.

```ts
{
  input?: number | string | undefined;
  output?: number | undefined;
}
```

## smallint

- Input value must be `number`, `string`, or `null`.
- Non-null values:
  - must be coercible to `number`.
  - Cannot be lower than -32768.
  - Cannot be greater than 32767.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  number | string | null | undefined;
  output?: number | null | undefined;
}
```

## text

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.

[Nullability and optionality](./input-output-types.md#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## time

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- Non-values must be a valid string that matches a time format.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  string | null | undefined;
  output?: string | null | undefined;
}
```

## time with time zone

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- Non-values must be a valid string that matches a time format.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  string | null | undefined;
  output?: string | null | undefined;
}
```

## timestamp

- Explicit `undefined` values are rejected.
- Input value must be `Date`, `string`, or `null`.
- Non-null values must be:
  - Coercible to a `Date`.
  - Date must be 4713 BC or later.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  Date | string | null | undefined;
  output?: Date | null | undefined;
}
```

## timestamp with timezone

- Explicit `undefined` values are rejected.
- Input value must be `Date`, `string`, or `null`.
- Non-null values must be:
  - Coercible to a `Date`.
  - Date must be 4713 BC or later.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  Date | string | null | undefined;
  output?: Date | null | undefined;
}
```

## tsquery

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## tsvector

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## uuid

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- String values must be a valid UUID.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

## xml

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### Optionality and nullability

By default, inputs and outputs in the generated Zod schemas are nullable and optional.

According to the column constraints, their default data value, and if they are generated they will change:

 |             Column                                                    | Optional | Nullable |
 | :---                                                                  | :----:   | :----:   |
 | with default data value                                               | yes      | yes      |
 | with `NOT NULL` constraint                                            | no       | no       |
 | with `NOT NULL` constraint with default data value                    | yes      | no       |
 | `serial`                                                              | yes      | no       |
 | `bigserial`                                                           | yes      | no       |
 | generated by default as identity                                      | yes      | no       |
 | primary key                                                           | no       | no       |
 | `serial`, `bigserial` generated by default as identity  primary key   | yes      | no       |
