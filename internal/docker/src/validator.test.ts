import { assert, test } from "vitest";
import { Dockerfile } from "~docker/df.js";
import { validate } from "~docker/validator.js";

test("validates DockerfileWriter", () => {
	const dw = new Dockerfile();
	dw.FROM("alpine");
	assert.isTrue(validate(dw));
});

test("throws an error on invalid", () => {
	const dw = new Dockerfile();
	assert.throws(() => validate(dw), "Invalid Dockerfile");
});
