[@monolayer/factor-four](../globals.md) / MemcachedContainer

# Class: MemcachedContainer

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

### new MemcachedContainer()

> **new MemcachedContainer**(`options`): [`MemcachedContainer`](MemcachedContainer.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemcachedContainerOptions`](../interfaces/MemcachedContainerOptions.md) |

#### Returns

[`MemcachedContainer`](MemcachedContainer.md)

#### Overrides

`Container.constructor`

## Methods

### start()

> **start**(): `Promise`\<[`StartedMemcachedContainer`](StartedMemcachedContainer.md)\>

Starts the container.

#### Returns

`Promise`\<[`StartedMemcachedContainer`](StartedMemcachedContainer.md)\>

#### Overrides

[`Container`](Container.md).[`start`](Container.md#start)

***

### startPersisted()

> **startPersisted**(): `Promise`\<[`StartedMemcachedContainer`](StartedMemcachedContainer.md)\>

#### Returns

`Promise`\<[`StartedMemcachedContainer`](StartedMemcachedContainer.md)\>

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
