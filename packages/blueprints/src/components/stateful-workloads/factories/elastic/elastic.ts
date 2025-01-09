import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { DigitalOceanElastic } from "./adapters/digital-ocean";
import { SwarmElastic } from "./adapters/swarm";
export class Elastic extends Factory<ElasticDeployAdapters> {}

export interface ElasticPorts {
	deploy(...args: unknown[]): unknown;
}

interface ElasticDeployAdapters {
	digitalocean: AdapterWithConfigAndPorts<ElasticPorts, DigitalOceanElastic>;
	swarm: AdapterWithConfigAndPorts<ElasticPorts, SwarmElastic>;
}

Elastic.instance().register("digitalocean", (config) => new DigitalOceanElastic(config));
Elastic.instance().register("swarm", (config) => new SwarmElastic(config));
