import { Factory, type AdapterWithConfigAndPorts } from "../../../lib/factory";
import { DigitalOcean } from "./adapters/digital-ocean";
import { Swarm } from "./adapters/swarm";

export interface LoadBalancerPorts {
	deploy(...args: unknown[]): unknown;
}

interface LoadBalancerAdapters {
	"digital-ocean": AdapterWithConfigAndPorts<LoadBalancerPorts, DigitalOcean>;
	swarm: AdapterWithConfigAndPorts<LoadBalancerPorts, Swarm>;
}

export class LoadBalancer extends Factory<LoadBalancerAdapters> {}

LoadBalancer.instance().register("swarm", (config) => new Swarm(config));
LoadBalancer.instance().register("digital-ocean", (config) => new DigitalOcean(config));
