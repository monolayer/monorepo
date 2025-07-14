import { type Task } from "~workloads/workloads/stateless/task/task.js";

export default async <P>({
	task,
	taskId,
	data,
}: {
	task: Task<P>;
	taskId: string;
	data: P;
}) => {
	try {
		await task.work({ taskId, data });
	} catch (error) {
		task.handleError(error, data, taskId);
	}
};
