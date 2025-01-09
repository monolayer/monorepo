import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { DOMongoDb } from "./adapters/digital-ocean";
import { SwarmMongoDb } from "./adapters/swarm";
export class MongoDb extends Factory<MongoDbAdapters> {}

export interface MongoDbPorts {
	deploy(...args: unknown[]): unknown;
}

interface MongoDbAdapters {
	digitalocean: AdapterWithConfigAndPorts<MongoDbPorts, DOMongoDb>;
	swarm: AdapterWithConfigAndPorts<MongoDbPorts, SwarmMongoDb>;
}

MongoDb.instance().register("digitalocean", (config) => new DOMongoDb(config));
MongoDb.instance().register("swarm", (config) => new SwarmMongoDb(config));
