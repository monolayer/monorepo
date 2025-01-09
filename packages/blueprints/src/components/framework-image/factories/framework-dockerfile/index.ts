import { Dockerfile } from "@monolayer/dw";
import { FactoryWithoutConfig, type AdapterWithPorts } from "../../../../lib/factory";
import { NextJs } from "./adapters/nextjs";
export interface FrameworkDockerfilePorts {
	dockerfile(): Dockerfile;
}

export interface FrameworkDockerfileAdapters {
	nextjs: AdapterWithPorts<FrameworkDockerfilePorts, NextJs>;
}

export class FrameworkDockerfile extends FactoryWithoutConfig<FrameworkDockerfileAdapters> {}

FrameworkDockerfile.instance().register("nextjs", () => new NextJs());
