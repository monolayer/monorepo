import ora from "ora";
import { writeWorkload } from "./workload.js";

type Cron = {
	id: string;
	name: string;
};

export function addCronWorkload(cron: Cron) {
	const template = cronWorkload(cron);
	const spinner = ora();
	spinner.start(`Create cron workload in ./workloads/${cron.id}.ts`);
	writeWorkload(cron.id, template);
	spinner.succeed();
}

function cronWorkload(task: Cron) {
	return `import { Cron } from "@monolayer/sdk";

const ${task.name} = new Cron("${task.id}", {
	schedule: "* * * * *",
	run: async () => {
		console.log("Hello, world!");
	},
});

export default ${task.name};
`;
}
