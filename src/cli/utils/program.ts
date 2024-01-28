import { Command } from "commander";

export function exitProgramWithError(program: Command, error: unknown) {
	console.error("\n", error);
	program.error("Unexpected error");
}
