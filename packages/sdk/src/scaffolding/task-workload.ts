import { pascalCase } from "case-anything";
import ora from "ora";
import { writeWorkload } from "./workload.js";

type Task = {
	id: string;
	name: string;
};

export function addTaskWorkload(task: Task) {
	const template = taskWorkload(task);
	const spinner = ora();
	spinner.start(`Create task workload in ./workloads/${task.id}.ts`);
	writeWorkload(task.id, template);
	spinner.succeed();
}

function taskWorkload(task: Task) {
	return `import { Task } from "@monolayer/sdk";

export type ${pascalCase(task.name)}Data = {
  message: string;
}

const ${task.name} = new Task<${pascalCase(task.name)}Data>("${task.id}", async ({ data }) => {
	console.log("message", data.message);
});

export default ${task.name};
`;
}
