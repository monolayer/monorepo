[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgForeignKey

# Class: PgForeignKey\<T, C\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |
| `C` *extends* `AnyPgTable` |

## Methods

### deleteRule()

> **deleteRule**(`rule`): [`PgForeignKey`](PgForeignKey.md)\<`T`, `C`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rule` | `"cascade"` \| `"set null"` \| `"set default"` \| `"restrict"` \| `"no action"` |

#### Returns

[`PgForeignKey`](PgForeignKey.md)\<`T`, `C`\>

#### Defined in

[../internal/pg/src/schema/foreign-key.ts:179](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L179)

***

### external()

> **external**(): [`PgForeignKey`](PgForeignKey.md)\<`T`, `C`\>

#### Returns

[`PgForeignKey`](PgForeignKey.md)\<`T`, `C`\>

#### Defined in

[../internal/pg/src/schema/foreign-key.ts:189](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L189)

***

### updateRule()

> **updateRule**(`rule`): [`PgForeignKey`](PgForeignKey.md)\<`T`, `C`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rule` | `"cascade"` \| `"set null"` \| `"set default"` \| `"restrict"` \| `"no action"` |

#### Returns

[`PgForeignKey`](PgForeignKey.md)\<`T`, `C`\>

#### Defined in

[../internal/pg/src/schema/foreign-key.ts:184](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L184)
