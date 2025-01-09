import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { DigitalOceanPostgres } from "./adapters/digital-ocean";
import { SwarmPostgres } from "./adapters/swarm";
export class Postgres extends Factory<PostgresAdapters> {}

export interface PostgresPorts {
	deploy(...args: unknown[]): unknown;
}

interface PostgresAdapters {
	digitalocean: AdapterWithConfigAndPorts<PostgresPorts, DigitalOceanPostgres>;
	swarm: AdapterWithConfigAndPorts<PostgresPorts, SwarmPostgres>;
}

Postgres.instance().register("digitalocean", (config) => new DigitalOceanPostgres(config));
Postgres.instance().register("swarm", (config) => new SwarmPostgres(config));
