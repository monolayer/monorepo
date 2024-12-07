import { validate } from "@monorepo/docker/validator.js";
import { assert, test } from "vitest";
import { generateNode20Dockerfile } from "~workloads/beamer/blueprints/docker/dockerfiles/dockerfile-node20.js";

test("validate dockerfile", () => {
	assert.isTrue(validate(generateNode20Dockerfile(["index.js"])));
});
