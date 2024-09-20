export async function sesEmails(port: number) {
	const response = await fetch(`http://localhost:${port}/store`);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ((await response.json()) as any).emails;
}
