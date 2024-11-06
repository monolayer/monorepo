import ora from "ora";
import color from "picocolors";

export async function logWithSpinner(msg: string, fn: () => Promise<void>) {
	const spinner = ora();
	spinner.start(msg);
	const start = performance.now();
	try {
		await fn();
		const end = performance.now();
		const milliseconds = Number(end - start).toFixed(3);
		spinner.succeed(`${msg} ${color.gray(`(${milliseconds}ms)`)}`);
	} catch (e) {
		spinner.fail();
		throw e;
	}
}
