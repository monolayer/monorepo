import { FactoryWithoutConfig, type AdapterWithPorts } from "../../factory";
import { DockerBuild } from "./adapters/docker-build";

export interface ImagesPorts {
	buildAndPush(...args: unknown[]): unknown;
}

export interface ImagesAdapters {
	"docker-build": AdapterWithPorts<ImagesPorts, DockerBuild>;
}

export interface Image {
	name: string;
	tag: string;
	dockerFile: string;
	platforms: string[];
	context: string;
}

export class Images extends FactoryWithoutConfig<ImagesAdapters> {}

Images.instance().register("docker-build", () => new DockerBuild());
