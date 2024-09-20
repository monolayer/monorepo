[@monolayer/factor-four](../globals.md) / StartedSESContainer

# Class: StartedSESContainer

## Extends

- `StartedServerContainerWithWebUI`\<[`StartedSESContainer`](StartedSESContainer.md)\>

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

### new StartedSESContainer()

> **new StartedSESContainer**(`startedTestContainer`, `callback`?): [`StartedSESContainer`](StartedSESContainer.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startedTestContainer` | `StartedTestContainer` |
| `callback`? | (`startedContainer`) => `void` |

#### Returns

[`StartedSESContainer`](StartedSESContainer.md)

#### Inherited from

`StartedServerContainerWithWebUI<StartedSESContainer>.constructor`
