import { afterEach, expect, test, vi } from "vitest";
import { Bucket } from "~workloads/workloads/stateful/bucket.js";
import { StatefulWorkload } from "~workloads/workloads/stateful/stateful-workload.js";

afterEach(() => {
	vi.unstubAllEnvs();
});

test("is a StatefulWorkload", () => {
	expect(Bucket.prototype).toBeInstanceOf(StatefulWorkload);
});

test("name from env var in production", () => {
	const bucket = new Bucket("work-documents");
	vi.stubEnv("NODE_ENV", "production");
	vi.stubEnv("ML_WORK_DOCUMENTS_BUCKET_NAME", "my_bucket");
	expect(bucket.name).toStrictEqual("my_bucket");
});

test("name from env var in production throws on missing", () => {
	const bucket = new Bucket("work-documents");
	expect(() => bucket.name).toThrow(
		"Undefined bucket name for Bucket work-documents. ML_WORK_DOCUMENTS_BUCKET_NAME not set.",
	);
});

test("name from env var in development", () => {
	const bucket = new Bucket("work-documents");
	vi.stubEnv("NODE_ENV", "development");
	expect(bucket.name).toStrictEqual("work-documents-development");
});

test("name from env var in test", () => {
	const bucket = new Bucket("work-documents");
	vi.stubEnv("NODE_ENV", "test");
	expect(bucket.name).toStrictEqual("work-documents-test");
});
