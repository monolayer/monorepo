[@monolayer/factor-four](../globals.md) / StartedRedisContainer

# Class: StartedRedisContainer

## Extends

- `StartedServerContainerWithWebUI`\<[`StartedRedisContainer`](StartedRedisContainer.md)\>

## Accessors

### connectionURL

> `get` **connectionURL**(): `string`

#### Returns

`string`

#### Overrides

`StartedServerContainerWithWebUI.connectionURL`

***

### serverPort

> `get` **serverPort**(): `number`

#### Returns

`number`

#### Overrides

`StartedServerContainerWithWebUI.serverPort`

***

### webUIPort

> `get` **webUIPort**(): `number`

#### Returns

`number`

#### Overrides

`StartedServerContainerWithWebUI.webUIPort`

***

### webURL

> `get` **webURL**(): `string`

#### Returns

`string`

#### Overrides

`StartedServerContainerWithWebUI.webURL`

## Constructors

### new StartedRedisContainer()

> **new StartedRedisContainer**(`startedTestContainer`, `callback`?): [`StartedRedisContainer`](StartedRedisContainer.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startedTestContainer` | `StartedTestContainer` |
| `callback`? | (`startedContainer`) => `void` |

#### Returns

[`StartedRedisContainer`](StartedRedisContainer.md)

#### Inherited from

`StartedServerContainerWithWebUI<StartedRedisContainer>.constructor`
