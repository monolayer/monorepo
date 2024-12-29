import { validate } from "@monorepo/docker/validator.js";
import { assert, test } from "vitest";
import { generateNode22Dockerfile } from "~workloads/make/dockerfiles/dockerfile-node22.js";

test("validate dockerfile", () => {
	assert.isTrue(validate(generateNode22Dockerfile(["index.js"])));
});

test("validate dockerfile with prisma", () => {
	assert.isTrue(
		validate(generateNode22Dockerfile(["index.js"], { prisma: true })),
	);
});
