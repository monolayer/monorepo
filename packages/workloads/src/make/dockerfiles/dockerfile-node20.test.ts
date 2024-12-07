import { validate } from "@monorepo/docker/validator.js";
import { assert, test } from "vitest";
import { generateNode20Dockerfile } from "~workloads/make/dockerfiles/dockerfile-node20.js";

test("validate dockerfile", () => {
	assert.isTrue(validate(generateNode20Dockerfile(["index.js"])));
});

test("validate dockerfile with prisma", () => {
	assert.isTrue(
		validate(generateNode20Dockerfile(["index.js"], { prisma: true })),
	);
});
