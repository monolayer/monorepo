import { assert, test } from "vitest";
import { Dockerfile } from "~dw/df.js";
import { validate } from "~dw/validator.js";

test("validates DockerfileWriter", () => {
	const dw = new Dockerfile();
	dw.FROM("alpine");
	assert.isTrue(validate(dw));
});

test("throws an error on invalid", () => {
	const dw = new Dockerfile();
	assert.throws(() => validate(dw), "Invalid Dockerfile");
});
