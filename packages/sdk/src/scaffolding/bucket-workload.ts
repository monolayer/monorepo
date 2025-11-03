import ora from "ora";
import { writeWorkload } from "./workload.js";

type Bucket = {
	id: string;
	name: string;
};

export function addBucketWorkload(bucket: Bucket) {
	const template = bucketWorkload(bucket);
	const spinner = ora();
	spinner.start(`Create bucket workload in ./workloads/${bucket.id}.ts`);
	writeWorkload(bucket.id, template);
	spinner.succeed();
}

function bucketWorkload(bucket: Bucket) {
	return `import { Bucket } from "@monolayer/sdk";

const ${bucket.name} = new Bucket("${bucket.id}");

export default ${bucket.name};
`;
}
