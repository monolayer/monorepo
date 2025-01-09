import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";

export function associateResourceToStackProject(
	id: string | pulumi.Output<string>,
	resourceUrn: pulumi.Output<string>,
	projectId: pulumi.Output<string>,
	pulumiResourceOptions?: pulumi.CustomResourceOptions,
) {
	pulumi.all([id, resourceUrn, projectId]).apply(([id, resourceUrn, projectId]) => {
		new digitalocean.ProjectResources(
			id,
			{
				project: projectId,
				resources: [resourceUrn],
			},
			pulumiResourceOptions,
		);
	});
}
