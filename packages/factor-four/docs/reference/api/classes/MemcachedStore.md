[@monolayer/factor-four](../globals.md) / MemcachedStore

# Class: MemcachedStore

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| `container` | [`MemcachedContainer`](MemcachedContainer.md) | Container for the [MemcachedStore](MemcachedStore.md). |
| `id` | `string` | ID of the [MemcachedStore](MemcachedStore.md). |

## Accessors

### client

> `get` **client**(): `MemcacheClient`

Returns a [memcache-client](https://www.npmjs.com/package/memcache-client) for the [MemcachedStore](MemcachedStore.md).

#### Returns

`MemcacheClient`

***

### credentialsEnvVar

> `get` **credentialsEnvVar**(): `string`

Returns the environment variable name that should contain the Memcached instance URL.

The client will connect to the memcached instance with this environment variable.

#### Remarks

Each [MemcachedStore](MemcachedStore.md) has a unique environment variable name (as long unique IDs are used).

#### Returns

`string`
