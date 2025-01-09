import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { DORedis } from "./adapters/digitial-ocean";
import { SwarmRedis } from "./adapters/swarm";

export interface RedisPorts {
	deploy(...args: unknown[]): unknown;
}

export interface RedisAdapters {
	digitalocean: AdapterWithConfigAndPorts<RedisPorts, DORedis>;
	swarm: AdapterWithConfigAndPorts<RedisPorts, SwarmRedis>;
}

export class Redis extends Factory<RedisAdapters> {}

Redis.instance().register("digitalocean", (config) => new DORedis(config));
Redis.instance().register("swarm", (config) => new SwarmRedis(config));
