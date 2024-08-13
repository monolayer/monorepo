[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgIndex

# Class: PgIndex\<T\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` \| `string` & `Record`\<`string`, `never`\> |

## Methods

### expression()

> **expression**(`expression`): [`PgIndex`](PgIndex.md)\<`T`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `expression` | `Expression`\<`SqlBool`\> |

#### Returns

[`PgIndex`](PgIndex.md)\<`T`\>

#### Defined in

[../internal/pg/src/schema/index.ts:72](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L72)

***

### external()

> **external**(): [`PgIndex`](PgIndex.md)\<`T`\>

#### Returns

[`PgIndex`](PgIndex.md)\<`T`\>

#### Defined in

[../internal/pg/src/schema/index.ts:104](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L104)

***

### ifNotExists()

> **ifNotExists**(): [`PgIndex`](PgIndex.md)\<`T`\>

#### Returns

[`PgIndex`](PgIndex.md)\<`T`\>

#### Defined in

[../internal/pg/src/schema/index.ts:57](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L57)

***

### nullsNotDistinct()

> **nullsNotDistinct**(): [`PgIndex`](PgIndex.md)\<`T`\>

#### Returns

[`PgIndex`](PgIndex.md)\<`T`\>

#### Defined in

[../internal/pg/src/schema/index.ts:67](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L67)

***

### unique()

> **unique**(): [`PgIndex`](PgIndex.md)\<`T`\>

#### Returns

[`PgIndex`](PgIndex.md)\<`T`\>

#### Defined in

[../internal/pg/src/schema/index.ts:62](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L62)

***

### using()

> **using**(`indexType`): [`PgIndex`](PgIndex.md)\<`T`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `indexType` | `string` |

#### Returns

[`PgIndex`](PgIndex.md)\<`T`\>

#### Defined in

[../internal/pg/src/schema/index.ts:77](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L77)

***

### where()

#### where(lhs, op, rhs)

> **where**(`lhs`, `op`, `rhs`): `this`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `lhs` | `Expression`\<`any`\> \| `T` |
| `op` | `ComparisonOperatorExpression` |
| `rhs` | `unknown` |

##### Returns

`this`

##### Defined in

[../internal/pg/src/schema/index.ts:82](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L82)

#### where(factory)

> **where**(`factory`): `this`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `factory` | (`qb`) => `Expression`\<`SqlBool`\> |

##### Returns

`this`

##### Defined in

[../internal/pg/src/schema/index.ts:88](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L88)

#### where(expression)

> **where**(`expression`): `this`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `expression` | `Expression`\<`SqlBool`\> |

##### Returns

`this`

##### Defined in

[../internal/pg/src/schema/index.ts:97](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/index.ts#L97)
