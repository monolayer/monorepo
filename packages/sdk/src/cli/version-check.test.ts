import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { checkVersion } from "./version-check.js";

// Mock the global fetch function
global.fetch = vi.fn();

const consoleLogSpy = vi
	.spyOn(console, "log")
	.mockImplementation(() => undefined);

afterEach(() => {
	consoleLogSpy.mockReset();
});

describe("should mock console.log", () => {
	const consoleMock = vi
		.spyOn(console, "log")
		.mockImplementation(() => undefined);

	afterAll(() => {
		consoleMock.mockReset();
	});

	it("should log `sample output`", () => {
		console.log("sample output");
		expect(consoleMock).toHaveBeenCalledOnce();
		expect(consoleMock).toHaveBeenLastCalledWith("sample output");
	});
});

describe("checkVersion", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should log a message if the current version is outdated", async () => {
		const mockResponse = {
			json: () => Promise.resolve({ version: "1.0.1" }),
			ok: true,
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(fetch as any).mockResolvedValue(mockResponse);

		await checkVersion("1.0.0");

		expect(consoleLogSpy).toHaveBeenCalledWith(
			"A new version of @monolayer/sdk is available. Current version: 1.0.0, Latest version: 1.0.1",
		);
	});

	it("should not log a message if the current version is the latest", async () => {
		const mockResponse = {
			json: () => Promise.resolve({ version: "1.0.0" }),
			ok: true,
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(fetch as any).mockResolvedValue(mockResponse);

		await checkVersion("1.0.0");

		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should handle network errors gracefully", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(fetch as any).mockRejectedValue(new Error("Network error"));

		await expect(checkVersion("1.0.0")).resolves.toBeUndefined();
		expect(consoleLogSpy).not.toHaveBeenCalled();
	});

	it("should handle malformed JSON responses gracefully", async () => {
		const mockResponse = {
			json: () => Promise.reject(new Error("Invalid JSON")),
			ok: true,
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(fetch as any).mockResolvedValue(mockResponse);

		await expect(checkVersion("1.0.0")).resolves.toBeUndefined();
		expect(consoleLogSpy).not.toHaveBeenCalled();
	});
});
