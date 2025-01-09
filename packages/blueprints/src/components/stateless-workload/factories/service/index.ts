import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { Swarm } from "./adapters/swarm";

export interface StatelessServicePorts {
	deploy(...args: unknown[]): unknown;
}

interface StatelessServiceAdapters {
	swarm: AdapterWithConfigAndPorts<StatelessServicePorts, Swarm>;
}

export class StatelessService extends Factory<StatelessServiceAdapters> {}

StatelessService.instance().register("swarm", (config) => new Swarm(config));
