[@monolayer/factor-four](../globals.md) / StartedMemcachedContainer

# Class: StartedMemcachedContainer

## Extends

- `StartedServerContainer`\<[`StartedMemcachedContainer`](StartedMemcachedContainer.md)\>

## Accessors

### connectionURL

> `get` **connectionURL**(): `string`

#### Returns

`string`

#### Overrides

`StartedServerContainer.connectionURL`

***

### serverPort

> `get` **serverPort**(): `number`

#### Returns

`number`

#### Overrides

`StartedServerContainer.serverPort`

## Constructors

### new StartedMemcachedContainer()

> **new StartedMemcachedContainer**(`startedTestContainer`, `callback`?): [`StartedMemcachedContainer`](StartedMemcachedContainer.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startedTestContainer` | `StartedTestContainer` |
| `callback`? | (`startedContainer`) => `void` |

#### Returns

[`StartedMemcachedContainer`](StartedMemcachedContainer.md)

#### Inherited from

`StartedServerContainer<StartedMemcachedContainer>.constructor`
