[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgUnmanagedForeignKey

# Class: PgUnmanagedForeignKey\<T, C\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |
| `C` *extends* `string` |

## Methods

### deleteRule()

> **deleteRule**(`rule`): [`PgUnmanagedForeignKey`](PgUnmanagedForeignKey.md)\<`T`, `C`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rule` | `"cascade"` \| `"set null"` \| `"set default"` \| `"restrict"` \| `"no action"` |

#### Returns

[`PgUnmanagedForeignKey`](PgUnmanagedForeignKey.md)\<`T`, `C`\>

#### Defined in

[../internal/pg/src/schema/foreign-key.ts:320](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L320)

***

### external()

> **external**(): [`PgUnmanagedForeignKey`](PgUnmanagedForeignKey.md)\<`T`, `C`\>

#### Returns

[`PgUnmanagedForeignKey`](PgUnmanagedForeignKey.md)\<`T`, `C`\>

#### Defined in

[../internal/pg/src/schema/foreign-key.ts:330](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L330)

***

### updateRule()

> **updateRule**(`rule`): [`PgUnmanagedForeignKey`](PgUnmanagedForeignKey.md)\<`T`, `C`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rule` | `"cascade"` \| `"set null"` \| `"set default"` \| `"restrict"` \| `"no action"` |

#### Returns

[`PgUnmanagedForeignKey`](PgUnmanagedForeignKey.md)\<`T`, `C`\>

#### Defined in

[../internal/pg/src/schema/foreign-key.ts:325](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L325)
