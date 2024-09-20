[@monolayer/factor-four](../globals.md) / RedisContainer

# Class: RedisContainer

**Not to be used directly.**

Use constructor functions instead.

## Extends

- [`Container`](Container.md)

## Properties

| Property | Type | Inherited from |
| ------ | ------ | ------ |
| `name` | `string` | [`Container`](Container.md).`name` |
| `persistenceVolumes` | `object`[] | [`Container`](Container.md).`persistenceVolumes` |
| `portsToExpose` | `number`[] | [`Container`](Container.md).`portsToExpose` |

## Constructors

### new RedisContainer()

> **new RedisContainer**(`options`): [`RedisContainer`](RedisContainer.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`RedisContainerOptions`](../interfaces/RedisContainerOptions.md) |

#### Returns

[`RedisContainer`](RedisContainer.md)

#### Overrides

`Container.constructor`

## Methods

### start()

> **start**(): `Promise`\<[`StartedRedisContainer`](StartedRedisContainer.md)\>

Starts the container.

#### Returns

`Promise`\<[`StartedRedisContainer`](StartedRedisContainer.md)\>

#### Overrides

[`Container`](Container.md).[`start`](Container.md#start)

***

### startPersisted()

> **startPersisted**(): `Promise`\<[`StartedRedisContainer`](StartedRedisContainer.md)\>

#### Returns

`Promise`\<[`StartedRedisContainer`](StartedRedisContainer.md)\>

***

### startWithVolumes()

> **startWithVolumes**(): `Promise`\<`StartedTestContainer`\>

Starts the container with mounted volumes.

#### Returns

`Promise`\<`StartedTestContainer`\>

#### Inherited from

[`Container`](Container.md).[`startWithVolumes`](Container.md#startwithvolumes)

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

#### Inherited from

[`Container`](Container.md).[`isRunning`](Container.md#isrunning)

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

#### Inherited from

[`Container`](Container.md).[`stop`](Container.md#stop)
