[@monolayer/factor-four](../globals.md) / RedisStore

# Class: RedisStore

## Properties

| Property | Type |
| ------ | ------ |
| `container` | [`RedisContainer`](RedisContainer.md) |
| `id` | `string` |

## Accessors

### client

> `get` **client**(): `RedisClientType`\<`RedisModules`, `RedisFunctions`, `RedisScripts`\>

Returns the Redis client for the RedisStore

#### Returns

`RedisClientType`\<`RedisModules`, `RedisFunctions`, `RedisScripts`\>

***

### credentialsEnvVar

> `get` **credentialsEnvVar**(): `string`

Returns the environment variable name that should contain the Memcached instance URL.

#### Returns

`string`

## Constructors

### new RedisStore()

> **new RedisStore**(`id`): [`RedisStore`](RedisStore.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`RedisStore`](RedisStore.md)
