import { writeFileSync } from "fs";
import ora from "ora";
import path from "path";

type Bucket = {
	id: string;
	name: string;
};

export function addBucketWorkload(bucket: Bucket) {
	const template = bucketWorkload(bucket);
	const spinner = ora();
	spinner.start(`Create bucket workload in ./workloads/${bucket.id}.ts`);
	writeFileSync(path.join("workloads", `${bucket.id}.ts`), template);
	spinner.succeed();
}

function bucketWorkload(bucket: Bucket) {
	return `import { Bucket } from "@monolayer/sdk";

const ${bucket.name} = new Bucket("${bucket.id}");

export default ${bucket.name};
`;
}
