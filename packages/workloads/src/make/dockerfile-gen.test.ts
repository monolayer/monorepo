/* eslint-disable max-lines */
import { beforeEach, describe, expect, test } from "vitest";
import { DockerfileGen } from "~workloads/make/dockerfile-gen.js";

interface TestContext {
	dockerfile: DockerfileGen;
}

beforeEach<TestContext>((context) => {
	context.dockerfile = new DockerfileGen();
});

describe("FROM", () => {
	test<TestContext>("only image", (context) => {
		context.dockerfile.FROM("node:20-slim");

		expect(context.dockerfile.print()).toStrictEqual("FROM node:20-slim\n");
	});

	test<TestContext>("with platform", (context) => {
		context.dockerfile.FROM("node:20-slim", { platform: "linux/arm64" });

		expect(context.dockerfile.print()).toStrictEqual(
			"FROM --platform=linux/arm64 node:20-slim\n",
		);
	});

	test<TestContext>("with as", (context) => {
		context.dockerfile.FROM("node:20-slim", { as: "base" });

		expect(context.dockerfile.print()).toStrictEqual(
			"FROM node:20-slim AS base\n",
		);
	});

	test<TestContext>("full", (context) => {
		context.dockerfile.FROM("node:20-slim", {
			as: "base",
			platform: "linux/arm64",
		});

		expect(context.dockerfile.print()).toStrictEqual(
			"FROM --platform=linux/arm64 node:20-slim AS base\n",
		);
	});
});

test<TestContext>("WORKDIR", (context) => {
	context.dockerfile.WORKDIR("/app");
	expect(context.dockerfile.print()).toStrictEqual("WORKDIR /app\n");
});

test<TestContext>("comment", (context) => {
	context.dockerfile.comment("this is a comment");
	expect(context.dockerfile.print()).toStrictEqual("# this is a comment");
});

test<TestContext>("blank", (context) => {
	context.dockerfile.blank();
	expect(context.dockerfile.print()).toStrictEqual("");
});

describe("RUN", () => {
	test<TestContext>("single", (context) => {
		context.dockerfile.RUN("apt-get update");
		expect(context.dockerfile.print()).toStrictEqual("RUN apt-get update\n");
	});

	test<TestContext>("multiple", (context) => {
		context.dockerfile.RUN(["apt-get update", "apt-get install -y curl"]);
		expect(context.dockerfile.print()).toStrictEqual(`\
RUN <<EOF
apt-get update
apt-get install -y curl
EOF
`);
	});

	test<TestContext>("with bind mount", (context) => {
		context.dockerfile.RUN("tsc .", {
			mount: {
				type: "bind",
				target: "/root/.build",
				source: "./tmp/build",
				from: "/home/ci",
				readwrite: true,
			},
		});
		expect(context.dockerfile.print()).toStrictEqual(
			`\
RUN --mount=type=bind,target=/root/.build,source=./tmp/build,from=/home/ci,readwrite \\
    tsc .\n`,
		);
	});

	test<TestContext>("with multiple bind mount", (context) => {
		context.dockerfile.RUN("tsc .", {
			mount: [
				{
					type: "bind",
					target: "/root/.build",
					source: "./tmp/build",
					from: "/home/ci",
					readwrite: true,
				},
				{
					type: "cache",
					target: "/root/.cache",
					source: "./tmp/cache",
					from: "/home/cache",
				},
			],
		});
		expect(context.dockerfile.print()).toStrictEqual(
			`\
RUN --mount=type=bind,target=/root/.build,source=./tmp/build,from=/home/ci,readwrite \\
    --mount=type=cache,target=/root/.cache,source=./tmp/cache,from=/home/cache \\
    tsc .\n`,
		);
	});

	test<TestContext>("multiple with bind mount", (context) => {
		context.dockerfile.RUN(["npx run build", "npx run alias"], {
			mount: {
				type: "bind",
				target: "/root/.build",
				source: "./tmp/build",
				from: "/home/ci",
				readwrite: true,
			},
		});
		expect(context.dockerfile.print()).toStrictEqual(`\
RUN --mount=type=bind,target=/root/.build,source=./tmp/build,from=/home/ci,readwrite <<EOF
npx run build
npx run alias
EOF
`);
	});
});

test<TestContext>("ENV", (context) => {
	context.dockerfile.ENV("NODE_ENV", "production");
	expect(context.dockerfile.print()).toStrictEqual(
		'ENV NODE_ENV="production"\n',
	);
});

test<TestContext>("ENTRYPOINT with executable", (context) => {
	context.dockerfile.ENTRYPOINT("node");
	expect(context.dockerfile.print()).toStrictEqual('ENTRYPOINT ["node"]\n');
});

test<TestContext>("ENTRYPOINT with executable and params", (context) => {
	context.dockerfile.ENTRYPOINT("node", ["myfile.js", "upcase"]);
	expect(context.dockerfile.print()).toStrictEqual(
		'ENTRYPOINT ["node", "myfile.js", "upcase"]\n',
	);
});

test<TestContext>("CMD with executable and params", (context) => {
	context.dockerfile.CMD("node", ["myfile.js", "upcase"]);
	expect(context.dockerfile.print()).toStrictEqual(
		'CMD ["node", "myfile.js", "upcase"]\n',
	);
});

test<TestContext>("CMD with params", (context) => {
	context.dockerfile.CMD(["myfile.js", "upcase"]);
	expect(context.dockerfile.print()).toStrictEqual(
		'CMD ["myfile.js", "upcase"]\n',
	);
});

describe("COPY", () => {
	test<TestContext>("single file", (context) => {
		context.dockerfile.COPY("package.json", ".");
		expect(context.dockerfile.print()).toStrictEqual("COPY package.json .\n");
	});

	test<TestContext>("single file with spaces in source", (context) => {
		context.dockerfile.COPY("/some/dir ect/package.json", ".");
		expect(context.dockerfile.print()).toStrictEqual(
			'COPY "/some/dir ect/package.json" .\n',
		);
	});

	test<TestContext>("single file with spaces in destination", (context) => {
		context.dockerfile.COPY("package.json", "/some/ directory");
		expect(context.dockerfile.print()).toStrictEqual(
			'COPY package.json "/some/ directory"\n',
		);
	});

	test<TestContext>("multiple files", (context) => {
		context.dockerfile.COPY(["package-lock.json", "package.json"], ".");
		expect(context.dockerfile.print()).toStrictEqual(
			"COPY package-lock.json package.json .\n",
		);
	});

	test<TestContext>("multiple files with spaces in sources", (context) => {
		context.dockerfile.COPY(
			["package-lock.json", "/some/other dir/package.json"],
			".",
		);
		expect(context.dockerfile.print()).toStrictEqual(
			'COPY package-lock.json "/some/other dir/package.json" .\n',
		);
	});

	test<TestContext>("multiple files with spaces in destination", (context) => {
		context.dockerfile.COPY(
			["package-lock.json", "/some/other dir/package.json"],
			"/my root dir/.",
		);
		expect(context.dockerfile.print()).toStrictEqual(
			'COPY package-lock.json "/some/other dir/package.json" "/my root dir/."\n',
		);
	});

	test<TestContext>("with options", (context) => {
		context.dockerfile.COPY("package.json", ".", {
			from: "base",
			chown: "myuser:mygroup",
			chmod: "644",
			link: true,
		});
		expect(context.dockerfile.print()).toStrictEqual(
			"COPY --from=base --chown=myuser:mygroup --chmod=644 --link package.json .\n",
		);
	});
});

test("insert a blank line between instructions by default", () => {
	const dockerfile = new DockerfileGen();
	dockerfile.FROM("node:20-slim");
	dockerfile.ENV("NODE_ENV", "production");

	expect(dockerfile.print()).toStrictEqual(`\
FROM node:20-slim

ENV NODE_ENV="production"
`);
});

test<TestContext>("SHELL", (context) => {
	context.dockerfile.SHELL("cmd", ["/S", "/C"]);
	expect(context.dockerfile.print()).toStrictEqual(
		'SHELL ["cmd", "/S", "/C"]\n',
	);
});

test<TestContext>("EXPOSE port", (context) => {
	context.dockerfile.EXPOSE(80);
	expect(context.dockerfile.print()).toStrictEqual("EXPOSE 80\n");
});

test<TestContext>("EXPOSE port with udp", (context) => {
	context.dockerfile.EXPOSE({ port: 80, protocol: "udp" });
	expect(context.dockerfile.print()).toStrictEqual("EXPOSE 80/udp\n");
});

test<TestContext>("EXPOSE port with tcp", (context) => {
	context.dockerfile.EXPOSE({ port: 80, protocol: "tcp" });
	expect(context.dockerfile.print()).toStrictEqual("EXPOSE 80/tcp\n");
});

describe("USER", () => {
	test<TestContext>("USER with name", (context) => {
		context.dockerfile.USER("node");
		expect(context.dockerfile.print()).toStrictEqual("USER node\n");
	});

	test<TestContext>("USER with name and group", (context) => {
		context.dockerfile.USER("node", "docker");
		expect(context.dockerfile.print()).toStrictEqual("USER node:docker\n");
	});

	test<TestContext>("USER with UID", (context) => {
		context.dockerfile.USER(501);
		expect(context.dockerfile.print()).toStrictEqual("USER 501\n");
	});

	test<TestContext>("USER with UID and GID", (context) => {
		context.dockerfile.USER(501, 400);
		expect(context.dockerfile.print()).toStrictEqual("USER 501:400\n");
	});
});

test<TestContext>("VOLUME single", (context) => {
	context.dockerfile.VOLUME("/data");
	expect(context.dockerfile.print()).toStrictEqual('VOLUME ["/data"]\n');
});

test<TestContext>("VOLUME multiple", (context) => {
	context.dockerfile.VOLUME("/data", "/var/log");
	expect(context.dockerfile.print()).toStrictEqual(
		'VOLUME ["/data", "/var/log"]\n',
	);
});

test<TestContext>("STOPSIGNAL with name", (context) => {
	context.dockerfile.STOPSIGNAL("SIGABRT");
	expect(context.dockerfile.print()).toStrictEqual("STOPSIGNAL SIGABRT\n");
});

test<TestContext>("STOPSIGNAL with number", (context) => {
	context.dockerfile.STOPSIGNAL(9);
	expect(context.dockerfile.print()).toStrictEqual("STOPSIGNAL 9\n");
});

test<TestContext>("ARG with name", (context) => {
	context.dockerfile.ARG("user1");
	expect(context.dockerfile.print()).toStrictEqual("ARG user1\n");
});

test<TestContext>("ARG with name and default value", (context) => {
	context.dockerfile.ARG("user1", "someuser");
	expect(context.dockerfile.print()).toStrictEqual("ARG user1=someuser\n");
});

describe("Add", () => {
	test<TestContext>("single file", (context) => {
		context.dockerfile.ADD("package.json", ".");
		expect(context.dockerfile.print()).toStrictEqual("ADD package.json .\n");
	});

	test<TestContext>("single file with spaces in source", (context) => {
		context.dockerfile.ADD("/some/dir ect/package.json", ".");
		expect(context.dockerfile.print()).toStrictEqual(
			'ADD "/some/dir ect/package.json" .\n',
		);
	});

	test<TestContext>("single file with spaces in destination", (context) => {
		context.dockerfile.ADD("package.json", "/some/ directory");
		expect(context.dockerfile.print()).toStrictEqual(
			'ADD package.json "/some/ directory"\n',
		);
	});

	test<TestContext>("multiple files", (context) => {
		context.dockerfile.ADD(["package-lock.json", "package.json"], ".");
		expect(context.dockerfile.print()).toStrictEqual(
			"ADD package-lock.json package.json .\n",
		);
	});

	test<TestContext>("multiple files with spaces in sources", (context) => {
		context.dockerfile.ADD(
			["package-lock.json", "/some/other dir/package.json"],
			".",
		);
		expect(context.dockerfile.print()).toStrictEqual(
			'ADD package-lock.json "/some/other dir/package.json" .\n',
		);
	});

	test<TestContext>("multiple files with spaces in destination", (context) => {
		context.dockerfile.ADD(
			["package-lock.json", "/some/other dir/package.json"],
			"/my root dir/.",
		);
		expect(context.dockerfile.print()).toStrictEqual(
			'ADD package-lock.json "/some/other dir/package.json" "/my root dir/."\n',
		);
	});

	test<TestContext>("with options", (context) => {
		context.dockerfile.ADD("package.json", ".", {
			keepGitDir: true,
			checksum: "sha256:somehash",
			chown: "myuser:mygroup",
			link: true,
			chmod: "644",
		});
		expect(context.dockerfile.print()).toStrictEqual(
			"ADD --keepGitDir --checksum=sha256:somehash --chown=myuser:mygroup --link --chmod=644 package.json .\n",
		);
	});
});

test<TestContext>("HEALTHCHECK", (context) => {
	context.dockerfile.HEALTHCHECK("curl -f http://localhost/ || exit 1");
	expect(context.dockerfile.print()).toStrictEqual(
		"HEALTHCHECK CMD curl -f http://localhost/ || exit 1\n",
	);
});

test<TestContext>("HEALTHCHECK with options", (context) => {
	context.dockerfile.HEALTHCHECK("curl -f http://localhost/ || exit 1", {
		interval: "40s",
		timeout: "1s",
		startPeriod: "10s",
		startInterval: "1s",
		retries: 5,
	});
	expect(context.dockerfile.print()).toStrictEqual(
		"HEALTHCHECK --interval=40s --timeout=1s --startPeriod=10s --startInterval=1s --retries=5 CMD curl -f http://localhost/ || exit 1\n",
	);
});

test<TestContext>("HEALTHCHECK NONE", (context) => {
	context.dockerfile.HEALTHCHECK("NONE");
	expect(context.dockerfile.print()).toStrictEqual("HEALTHCHECK NONE\n");
});
