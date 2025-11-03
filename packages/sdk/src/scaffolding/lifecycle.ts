import { writeFileSync } from "fs";
import ora from "ora";
import path from "path";

type Lifecycle = {
	id: string;
	name: string;
	scriptName: string;
};

export function addBeforeRolloutWorkload(lifecycle: Lifecycle) {
	const template = beforeRolloutWorkload(lifecycle);
	const spinner = ora();
	spinner.start(
		`Create before rollout workload in ./workloads/${lifecycle.id}.ts`,
	);
	writeFileSync(
		path.join("workloads", `before-rollout-${lifecycle.id}.ts`),
		template,
	);
	spinner.succeed();
}

function beforeRolloutWorkload(lifecycle: Lifecycle) {
	return `import { BeforeRollout } from "@monolayer/sdk";

const ${lifecycle.name} = new BeforeRollout("${lifecycle.id}", {
	script: "${lifecycle.scriptName}",
});

export default ${lifecycle.name};
`;
}

export function addAfterRolloutWorkload(lifecycle: Lifecycle) {
	const template = afterRolloutWorkload(lifecycle);
	const spinner = ora();
	spinner.start(
		`Create after rollout workload in ./workloads/${lifecycle.id}.ts`,
	);
	writeFileSync(
		path.join("workloads", `after-rollout-${lifecycle.id}.ts`),
		template,
	);
	spinner.succeed();
}

function afterRolloutWorkload(lifecycle: Lifecycle) {
	return `import { AfterRollout } from "@monolayer/sdk";

const ${lifecycle.name} = new AfterRollout("${lifecycle.id}", {
	script: "${lifecycle.scriptName}",
});

export default ${lifecycle.name};
`;
}

export function addBootstrapWorkload(lifecycle: Lifecycle) {
	const template = boostrapWorkload(lifecycle);
	const spinner = ora();
	spinner.start(
		`Create before rollout workload in ./workloads/${lifecycle.id}.ts`,
	);
	writeFileSync(
		path.join("workloads", `bootstrap-${lifecycle.id}.ts`),
		template,
	);
	spinner.succeed();
}

function boostrapWorkload(lifecycle: Lifecycle) {
	return `import { Bootstrap } from "@monolayer/sdk";

const ${lifecycle.name} = new Bootstrap("${lifecycle.id}", {
	script: "${lifecycle.scriptName}",
});

export default ${lifecycle.name};
`;
}
