[@monolayer/factor-four](../globals.md) / Container

# Class: Container

**Not to be used directly.**

Use constructor functions instead.

## Extends

- `GenericContainer`

## Extended by

- [`MemcachedContainer`](MemcachedContainer.md)
- [`RedisContainer`](RedisContainer.md)
- [`SESContainer`](SESContainer.md)
- [`SMTPContainer`](SMTPContainer.md)

## Properties

| Property | Type |
| ------ | ------ |
| `name` | `string` |
| `persistenceVolumes` | `object`[] |
| `portsToExpose` | `number`[] |

## Methods

### start()

> **start**(): `Promise`\<`StartedTestContainer`\>

Starts the container.

#### Returns

`Promise`\<`StartedTestContainer`\>

#### Overrides

`GenericContainer.start`

***

### startWithVolumes()

> **startWithVolumes**(): `Promise`\<`StartedTestContainer`\>

Starts the container with mounted volumes.

#### Returns

`Promise`\<`StartedTestContainer`\>

***

### isRunning()

> `static` **isRunning**(`container`): `Promise`\<`boolean`\>

Returns true if the container is running.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `container` | [`Container`](Container.md) |

#### Returns

`Promise`\<`boolean`\>

***

### stop()

> `static` **stop**(`container`): `Promise`\<`void`\>

Stops a container.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `container` | [`Container`](Container.md) |

#### Returns

`Promise`\<`void`\>
