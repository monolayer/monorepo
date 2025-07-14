import path from "node:path";
import { cwd } from "node:process";
import { vi } from "vitest";
import { workloadsConfiguration } from "~workloads/configuration.js";

vi.mock("~workloads/configuration.js", async (importOriginal) => {
	const actual =
		(await importOriginal()) as typeof import("~workloads/configuration.js");
	return {
		...actual,
		workloadsConfiguration: vi.fn(async () => {
			await importTestConfig();
		}),
	};
});

vi.mocked(workloadsConfiguration).mockResolvedValue(await importTestConfig());

async function importTestConfig() {
	const imported = await import(
		path.join(
			...[
				cwd(),
				cwd().includes("packages") ? "" : "packages/sdk",
				"test/fixtures/workloads.config.js",
			],
		)
	);
	return imported.default && imported.default.default
		? imported.default.default
		: imported.default;
}
