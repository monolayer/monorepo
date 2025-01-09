import { Factory, type AdapterWithConfigAndPorts } from "../../../../lib/factory";
import { DOMysqlDb } from "./adapters/digital-ocean";
import { SwarmMysql } from "./adapters/swarm";

export class Mysql extends Factory<MysqlAdapters> {}

export interface MysqlPorts {
	deploy(...args: unknown[]): unknown;
}

interface MysqlAdapters {
	digitalocean: AdapterWithConfigAndPorts<MysqlPorts, DOMysqlDb>;
	swarm: AdapterWithConfigAndPorts<MysqlPorts, SwarmMysql>;
}

Mysql.instance().register("digitalocean", (config) => new DOMysqlDb(config));
Mysql.instance().register("swarm", (config) => new SwarmMysql(config));
