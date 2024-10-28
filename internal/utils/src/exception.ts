export function isErrnoException(
	error: unknown,
): error is NodeJS.ErrnoException {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return error instanceof Error && typeof (error as any).code === "string";
}
