import { CommanderError } from "commander";
import { ExecaReturnBase, SyncOptions, execa } from "execa";

export enum ActionStatus {
	KyselyInstallationNotInstalled = "KyselyInstallationNotInstalled",
	KyselyInstallationInstalled = "KyselyInstallationInstalled",
	InstallKyselySuccess = "InstallKyselySuccess",
	Error = "Error",
	InitKineticFolderSuccess = "InitKineticFolderSuccess",
	pgInstallationNotInstalled = "pgInstallationNotInstalled",
	pgInstallationInstalled = "pgInstallationInstalled",
	InstallPgSuccess = "InstallPgSuccess",
	pgTypesInstallationNotInstalled = "pgTypesInstallationNotInstalled",
	pgTypesInstallationInstalled = "pgTypesInstallationInstalled",
	InstallPgTypesSuccess = "InstallPgTypesSuccess",
}

export type CommandSuccess = {
	status: ActionStatus;
	error?: undefined;
};

export type CommandError = {
	status: ActionStatus.Error;
	error: ExecaReturnBase<string | Buffer | undefined> | Error | unknown;
};

export type CommandResult = CommandSuccess | CommandError;

type ExecaCommandSuccess = {
	success: true;
	value: ExecaReturnBase<string | Buffer | undefined>;
	error?: undefined;
};

type ExecaCommandFailure = {
	success: false;
	error: ExecaReturnBase<string | Buffer | undefined> | Error | unknown;
	value?: undefined;
};

export type ExecaCommandResult = ExecaCommandSuccess | ExecaCommandFailure;

export async function runCommand(
	command: string,
	args: readonly string[] = [],
	options?: SyncOptions,
): Promise<ExecaCommandResult> {
	try {
		const result = execa(command, args, options);
		return {
			success: true,
			value: await result,
		};
	} catch (error) {
		if (isExecaError(error)) return { success: false, error: error };
		if (isError(error)) return { success: false, error: error };
		return { success: false, error: error };
	}
}

export function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

export function isExecaError(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	error: any,
): error is ExecaReturnBase<string | Buffer | undefined> {
	return (
		error.escapedCommand !== undefined &&
		error.command !== undefined &&
		error.exitCode !== undefined &&
		error.failed === true
	);
}

export function isError(error: unknown): error is Error {
	return error instanceof Error;
}
