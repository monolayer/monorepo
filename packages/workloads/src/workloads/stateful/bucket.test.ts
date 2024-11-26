import { expect, test } from "vitest";
import { Bucket } from "~workloads/workloads/stateful/bucket.js";
import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

test("is a StatefulWorkloadWithClient", () => {
	expect(Bucket.prototype).toBeInstanceOf(StatefulWorkloadWithClient);
});

test("name is id", () => {
	const bucket = new Bucket("images", () => true);
	expect(bucket.id).toStrictEqual(bucket.id);
});

test("connStringComponents", () => {
	const bucket = new Bucket("images", () => true);
	expect(bucket.connStringComponents).toStrictEqual(["aws", "endpoint"]);
});

test("connectionStringEnvVar", () => {
	const bucket = new Bucket("images", () => true);
	expect(bucket.connectionStringEnvVar).toStrictEqual("MONO_AWS_ENDPOINT_URL");
});
