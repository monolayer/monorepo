import {
	staticImplements,
	type ResourceContainer,
} from "~sidecar/resources/interfaces.js";

export function assertContainerizedResource<T extends ResourceContainer>(
	ctor: T,
) {
	staticImplements<ResourceContainer>(ctor);
}
