import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { DigitalOceanNetwork } from "./adapters/digitial-ocean";

export interface NetworkPorts {
	deploy(...args: unknown[]): unknown;
}

export interface NetworkAdapters {
	digitalocean: AdapterWithConfigAndPorts<NetworkPorts, DigitalOceanNetwork>;
}

export class Network extends Factory<NetworkAdapters> {}

Network.instance().register("digitalocean", (config) => new DigitalOceanNetwork(config));
