import { validate } from "@monorepo/docker/validator.js";
import { assert, expect, test } from "vitest";
import { generateNode22Dockerfile } from "~workloads/make/dockerfiles/dockerfile-node22.js";

test("Dockerfile", () => {
	const dockerfile = generateNode22Dockerfile([
		"index.js",
		"worker.cjs",
		"worker.cjs.map",
	]);
	expect(dockerfile.toString()).toStrictEqual(`\
# syntax=docker.io/docker/dockerfile:1

# ---------
# Base image stage
# ---------

FROM node:22-alpine3.20 AS base

# Add libc6-compat package (shared library required for use of process.dlopen).
# See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine
RUN apk add --no-cache gcompat=1.1.0-r4


# ---------
# Final stage
# ---------

FROM base AS run

WORKDIR /app

# Copy files from context
COPY index.js ./index.js
COPY worker.cjs ./worker.cjs
COPY worker.cjs.map ./worker.cjs.map

ENV NODE_ENV="production"

CMD ["index.mjs"]

ENTRYPOINT ["node"]
`);
	assert.isTrue(validate(dockerfile));
});

test("Dockerfile with Prisma", () => {
	const dockerfile = generateNode22Dockerfile(
		["index.js", "worker.cjs", "worker.cjs.map"],
		{ prisma: true },
	);
	expect(dockerfile.toString()).toStrictEqual(`\
# syntax=docker.io/docker/dockerfile:1

# ---------
# Base image stage
# ---------

FROM node:22-alpine3.20 AS base

# Add libc6-compat package (shared library required for use of process.dlopen).
# See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine
RUN apk add --no-cache gcompat=1.1.0-r4


# ---------
# Prisma dependencies
# ---------

FROM base AS prisma

COPY ./node_modules/.prisma/ ./node_modules/.prisma
COPY ./node_modules/prisma/ ./node_modules/prisma
COPY ./node_modules/@prisma/ ./node_modules/@prisma

# ---------
# Final stage
# ---------

FROM base AS run

WORKDIR /app

# Copy files from context
COPY index.js ./index.js
COPY worker.cjs ./worker.cjs
COPY worker.cjs.map ./worker.cjs.map

# Copy prisma dependencies
COPY --from=prisma ./node_modules/.prisma/ ./node_modules/.prisma
COPY --from=prisma ./node_modules/prisma/ ./node_modules/prisma
COPY --from=prisma ./node_modules/@prisma/ ./node_modules/@prisma

ENV NODE_ENV="production"

CMD ["index.mjs"]

ENTRYPOINT ["node"]
`);
	assert.isTrue(validate(dockerfile));
});
