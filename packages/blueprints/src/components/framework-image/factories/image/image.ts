import { FactoryWithoutConfig, type AdapterWithPorts } from "../../../../lib/factory";
import { DockerBuild } from "./adapters/docker-build";

export interface ImagesPorts {
	buildAndPush(...args: any): any;
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
