import type { ResourceContainer } from "~sidecar/container.js";
import type { GenericResource } from "~sidecar/resources/generic-resource.js";

export interface ContainerizedResource
	extends GenericResource,
		ResourceContainer {}
