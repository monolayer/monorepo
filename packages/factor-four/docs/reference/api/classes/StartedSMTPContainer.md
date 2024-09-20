[@monolayer/factor-four](../globals.md) / StartedSMTPContainer

# Class: StartedSMTPContainer

## Extends

- `StartedServerContainerWithWebUI`\<[`StartedSMTPContainer`](StartedSMTPContainer.md)\>

## Accessors

### connectionURL

> `get` **connectionURL**(): `string`

#### Returns

`string`

#### Overrides

`StartedServerContainerWithWebUI.connectionURL`

***

### messagesApiURL

> `get` **messagesApiURL**(): `string`

#### Returns

`string`

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

### new StartedSMTPContainer()

> **new StartedSMTPContainer**(`startedTestContainer`, `callback`?): [`StartedSMTPContainer`](StartedSMTPContainer.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startedTestContainer` | `StartedTestContainer` |
| `callback`? | (`startedContainer`) => `void` |

#### Returns

[`StartedSMTPContainer`](StartedSMTPContainer.md)

#### Inherited from

`StartedServerContainerWithWebUI<StartedSMTPContainer>.constructor`
