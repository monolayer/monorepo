import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { Swarm } from "./adapters/swarm";

export interface JobPorts {
	deploy(...args: unknown[]): unknown;
}

interface JobAdapters {
	swarm: AdapterWithConfigAndPorts<JobPorts, Swarm>;
}

export class Job extends Factory<JobAdapters> {}

Job.instance().register("swarm", (config) => new Swarm(config));
