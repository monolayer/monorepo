/* eslint-disable max-lines */
import { validate } from "dockerfile-utils";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { Dockerfile } from "~docker/df.js";

interface TestContext {
	dockerfile: Dockerfile;
}

beforeEach<TestContext>((context) => {
	context.dockerfile = new Dockerfile();
	mkdirSync(path.join(cwd(), "tmp", "dockerfiles"), { recursive: true });
});

afterEach<TestContext>(() => {
	rmSync(path.join(cwd(), "tmp", "dockerfiles"), { recursive: true });
});

describe("FROM", () => {
	test<TestContext>("only image", (context) => {
		context.dockerfile.FROM("node:20-slim");

		testOutputAndValidate(context.dockerfile, "FROM node:20-slim\n");
	});

	test<TestContext>("with platform", (context) => {
		context.dockerfile.FROM("node:20-slim", { platform: "linux/arm64" });

		testOutputAndValidate(
			context.dockerfile,
			"FROM --platform=linux/arm64 node:20-slim\n",
		);
	});

	test<TestContext>("with as", (context) => {
		context.dockerfile.FROM("node:20-slim", { as: "base" });

		testOutputAndValidate(context.dockerfile, "FROM node:20-slim AS base\n");
	});

	test<TestContext>("full", (context) => {
		context.dockerfile.FROM("node:20-slim", {
			as: "base",
			platform: "linux/arm64",
		});

		testOutputAndValidate(
			context.dockerfile,
			"FROM --platform=linux/arm64 node:20-slim AS base\n",
		);
	});
});

test<TestContext>("WORKDIR", (context) => {
	context.dockerfile.WORKDIR("/app");
	testOutputAndValidate(context.dockerfile, "WORKDIR /app\n", true);
});

test<TestContext>("WORKDIR ONBUILD", (context) => {
	context.dockerfile.WORKDIR("/app", { onBuild: true });
	testOutputAndValidate(context.dockerfile, "ONBUILD WORKDIR /app\n", true);
});

test<TestContext>("comment", (context) => {
	context.dockerfile.comment("this is a comment");
	testOutputAndValidate(context.dockerfile, "# this is a comment", true);
});

test<TestContext>("blank", (context) => {
	context.dockerfile.blank();
	testOutputAndValidate(context.dockerfile, "", true);
});

describe("RUN", () => {
	test<TestContext>("single", (context) => {
		context.dockerfile.RUN("apt-get update");
		testOutputAndValidate(context.dockerfile, "RUN apt-get update\n", true);
	});

	test<TestContext>("ONBUILD", (context) => {
		context.dockerfile.RUN("apt-get update", { onBuild: true });
		testOutputAndValidate(
			context.dockerfile,
			"ONBUILD RUN apt-get update\n",
			true,
		);
		context.dockerfile.RUN("/usr/local/bin/python-build --dir /app/src", {
			onBuild: true,
		});
	});

	test<TestContext>("multiple", (context) => {
		context.dockerfile.RUN(["apt-get update", "apt-get install -y curl"]);
		testOutputAndValidate(
			context.dockerfile,
			`\
RUN <<EOF
apt-get update
apt-get install -y curl
EOF
`,
			true,
		);
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
		testOutputAndValidate(
			context.dockerfile,
			`\
RUN --mount=type=bind,target=/root/.build,source=./tmp/build,from=/home/ci,readwrite \\
    tsc .\n`,
			true,
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
		testOutputAndValidate(
			context.dockerfile,
			`\
RUN --mount=type=bind,target=/root/.build,source=./tmp/build,from=/home/ci,readwrite \\
    --mount=type=cache,target=/root/.cache,source=./tmp/cache,from=/home/cache \\
    tsc .\n`,
			true,
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
		testOutputAndValidate(
			context.dockerfile,
			`\
RUN --mount=type=bind,target=/root/.build,source=./tmp/build,from=/home/ci,readwrite <<EOF
npx run build
npx run alias
EOF
`,
			true,
		);
	});
});

test<TestContext>("ENV", (context) => {
	context.dockerfile.ENV("NODE_ENV", "production");
	testOutputAndValidate(
		context.dockerfile,
		'ENV NODE_ENV="production"\n',
		true,
	);
});

test<TestContext>("ENV ONBUILD", (context) => {
	context.dockerfile.ENV("NODE_ENV", "production", { onBuild: true });
	testOutputAndValidate(
		context.dockerfile,
		'ONBUILD ENV NODE_ENV="production"\n',
		true,
	);
});

test<TestContext>("ENV with argument interpolation", (context) => {
	context.dockerfile.ENV("NODE_ENV", "${node_env}");
	testOutputAndValidate(context.dockerfile, "ENV NODE_ENV=${node_env}\n", true);
});

test<TestContext>("ENTRYPOINT with executable", (context) => {
	context.dockerfile.ENTRYPOINT("node");
	testOutputAndValidate(context.dockerfile, 'ENTRYPOINT ["node"]\n', true);
});

test<TestContext>("ENTRYPOINT with executable and params", (context) => {
	context.dockerfile.ENTRYPOINT("node", ["myfile.js", "upcase"]);
	testOutputAndValidate(
		context.dockerfile,
		'ENTRYPOINT ["node", "myfile.js", "upcase"]\n',
		true,
	);
});

test<TestContext>("CMD with executable and params", (context) => {
	context.dockerfile.CMD("node", ["myfile.js", "upcase"]);
	testOutputAndValidate(
		context.dockerfile,
		'CMD ["node", "myfile.js", "upcase"]\n',
		true,
	);
});

test<TestContext>("CMD with params", (context) => {
	context.dockerfile.CMD(["myfile.js", "upcase"]);
	testOutputAndValidate(
		context.dockerfile,
		'CMD ["myfile.js", "upcase"]\n',
		true,
	);
});

describe("COPY", () => {
	test<TestContext>("single file", (context) => {
		context.dockerfile.COPY("package.json", ".");
		testOutputAndValidate(context.dockerfile, "COPY package.json .\n", true);
	});

	test<TestContext>("single file with spaces in source", (context) => {
		context.dockerfile.COPY("/some/dir ect/package.json", "./");
		testOutputAndValidate(
			context.dockerfile,
			'COPY [ "/some/dir ect/package.json", "./" ]\n',
			true,
		);
	});

	test<TestContext>("single file with spaces in destination", (context) => {
		context.dockerfile.COPY("package.json", "/some/ directory/");
		testOutputAndValidate(
			context.dockerfile,
			'COPY [ "package.json", "/some/ directory/" ]\n',
			true,
		);
	});

	test<TestContext>("multiple files", (context) => {
		context.dockerfile.COPY(["package-lock.json", "package.json"], "./");
		testOutputAndValidate(
			context.dockerfile,
			"COPY package-lock.json package.json ./\n",
			true,
		);
	});

	test<TestContext>("multiple files with spaces in sources", (context) => {
		context.dockerfile.COPY(
			["package-lock.json", "/some/other dir/package.json"],
			"./",
		);
		testOutputAndValidate(
			context.dockerfile,
			'COPY [ "package-lock.json", "/some/other dir/package.json", "./" ]\n',
			true,
		);
	});

	test<TestContext>("multiple files with spaces in destination", (context) => {
		context.dockerfile.COPY(
			["package-lock.json", "/some/other dir/package.json"],
			"/my root dir/",
		);
		testOutputAndValidate(
			context.dockerfile,
			'COPY [ "package-lock.json", "/some/other dir/package.json", "/my root dir/" ]\n',
			true,
		);
	});

	test<TestContext>("with options", (context) => {
		context.dockerfile.COPY("package.json", ".", {
			from: "base",
			chown: "myuser:mygroup",
			chmod: "644",
			link: true,
		});
		testOutputAndValidate(
			context.dockerfile,
			"COPY --from=base --chown=myuser:mygroup --chmod=644 --link package.json .\n",
			true,
		);
	});

	test<TestContext>("with options ONBUILD", (context) => {
		context.dockerfile.COPY("package.json", ".", {
			from: "base",
			chown: "myuser:mygroup",
			chmod: "644",
			link: true,
			onBuild: true,
		});
		testOutputAndValidate(
			context.dockerfile,
			"ONBUILD COPY --from=base --chown=myuser:mygroup --chmod=644 --link package.json .\n",
			true,
		);
	});
});

test("insert a blank line between instructions by default", () => {
	const dockerfile = new Dockerfile();
	dockerfile.FROM("node:20-slim");
	dockerfile.ENV("NODE_ENV", "production");

	testOutputAndValidate(
		dockerfile,
		`\
FROM node:20-slim

ENV NODE_ENV="production"
`,
	);
});

test<TestContext>("SHELL", (context) => {
	context.dockerfile.SHELL("cmd", ["/S", "/C"]);
	testOutputAndValidate(
		context.dockerfile,
		'SHELL ["cmd", "/S", "/C"]\n',
		true,
	);
});

test<TestContext>("SHELL ONBUILD", (context) => {
	context.dockerfile.SHELL("cmd", ["/S", "/C"], { onBuild: true });
	testOutputAndValidate(
		context.dockerfile,
		'ONBUILD SHELL ["cmd", "/S", "/C"]\n',
		true,
	);
});

test<TestContext>("EXPOSE port", (context) => {
	context.dockerfile.EXPOSE(80);
	testOutputAndValidate(context.dockerfile, "EXPOSE 80\n", true);
});

test<TestContext>("EXPOSE multiple", (context) => {
	context.dockerfile.EXPOSE([80, 81]);
	testOutputAndValidate(context.dockerfile, "EXPOSE 80 81\n", true);
});

test<TestContext>("EXPOSE ONBUILD", (context) => {
	context.dockerfile.EXPOSE(80, { onBuild: true });
	testOutputAndValidate(context.dockerfile, "ONBUILD EXPOSE 80\n", true);
});

test<TestContext>("EXPOSE interpolated port", (context) => {
	context.dockerfile.EXPOSE("${server_port}");
	testOutputAndValidate(context.dockerfile, "EXPOSE ${server_port}\n", true);
});

test<TestContext>("EXPOSE port range", (context) => {
	context.dockerfile.EXPOSE("1000-10010");
	testOutputAndValidate(context.dockerfile, "EXPOSE 1000-10010\n", true);
});

test<TestContext>("EXPOSE port with udp", (context) => {
	context.dockerfile.EXPOSE({ port: 80, protocol: "udp" });
	testOutputAndValidate(context.dockerfile, "EXPOSE 80/udp\n", true);
});

test<TestContext>("EXPOSE interpolated port with udp", (context) => {
	context.dockerfile.EXPOSE({ port: "${server_port}", protocol: "udp" });
	testOutputAndValidate(
		context.dockerfile,
		"EXPOSE ${server_port}/udp\n",
		true,
	);
});

test<TestContext>("EXPOSE port range with udp", (context) => {
	context.dockerfile.EXPOSE({ port: "1000-10010", protocol: "udp" });
	testOutputAndValidate(context.dockerfile, "EXPOSE 1000-10010/udp\n", true);
});

test<TestContext>("EXPOSE port with tcp", (context) => {
	context.dockerfile.EXPOSE({ port: 80, protocol: "tcp" });
	testOutputAndValidate(context.dockerfile, "EXPOSE 80/tcp\n", true);
});

test<TestContext>("EXPOSE interpolated port with tcp", (context) => {
	context.dockerfile.EXPOSE({ port: "${server_port}", protocol: "tcp" });
	testOutputAndValidate(
		context.dockerfile,
		"EXPOSE ${server_port}/tcp\n",
		true,
	);
});

test<TestContext>("EXPOSE port range with tcp", (context) => {
	context.dockerfile.EXPOSE({ port: "1000-10010", protocol: "tcp" });
	testOutputAndValidate(context.dockerfile, "EXPOSE 1000-10010/tcp\n", true);
});

describe("USER", () => {
	test<TestContext>("USER with name", (context) => {
		context.dockerfile.USER({ name: "node" });
		testOutputAndValidate(context.dockerfile, "USER node\n", true);
	});

	test<TestContext>("USER with name and group", (context) => {
		context.dockerfile.USER({ name: "node", group: "docker" });
		testOutputAndValidate(context.dockerfile, "USER node:docker\n", true);
	});

	test<TestContext>("USER with UID", (context) => {
		context.dockerfile.USER({ uid: 501 });
		testOutputAndValidate(context.dockerfile, "USER 501\n", true);
	});

	test<TestContext>("USER with UID and GID", (context) => {
		context.dockerfile.USER({ uid: 501, gid: 400 });
		testOutputAndValidate(context.dockerfile, "USER 501:400\n", true);
	});

	test<TestContext>("USER ONBUILD", (context) => {
		context.dockerfile.USER({ name: "node" }, { onBuild: true });
		testOutputAndValidate(context.dockerfile, "ONBUILD USER node\n", true);
	});
});

test<TestContext>("VOLUME single", (context) => {
	context.dockerfile.VOLUME("/data");
	testOutputAndValidate(context.dockerfile, 'VOLUME ["/data"]\n', true);
});

test<TestContext>("VOLUME multiple", (context) => {
	context.dockerfile.VOLUME(["/data", "/var/log"]);
	testOutputAndValidate(
		context.dockerfile,
		'VOLUME ["/data", "/var/log"]\n',
		true,
	);
});

test<TestContext>("VOLUME ONBUILD", (context) => {
	context.dockerfile.VOLUME("/data", { onBuild: true });
	testOutputAndValidate(context.dockerfile, 'ONBUILD VOLUME ["/data"]\n', true);
});

test<TestContext>("STOPSIGNAL with name", (context) => {
	context.dockerfile.STOPSIGNAL("SIGABRT");
	testOutputAndValidate(context.dockerfile, "STOPSIGNAL SIGABRT\n", true);
});

test<TestContext>("STOPSIGNAL with number", (context) => {
	context.dockerfile.STOPSIGNAL(9);
	testOutputAndValidate(context.dockerfile, "STOPSIGNAL 9\n", true);
});

test<TestContext>("STOPSIGNAL ONBUILD", (context) => {
	context.dockerfile.STOPSIGNAL("SIGABRT", { onBuild: true });
	testOutputAndValidate(
		context.dockerfile,
		"ONBUILD STOPSIGNAL SIGABRT\n",
		true,
	);
});

test<TestContext>("ARG with name", (context) => {
	context.dockerfile.ARG("user1");
	testOutputAndValidate(context.dockerfile, "ARG user1\n", true);
});

test<TestContext>("ARG ONBUILD", (context) => {
	context.dockerfile.ARG("user1", { onBuild: true });
	testOutputAndValidate(context.dockerfile, "ONBUILD ARG user1\n", true);
});

test<TestContext>("ARG with name and default value", (context) => {
	context.dockerfile.ARG("user1", { default: "someuser" });
	testOutputAndValidate(context.dockerfile, 'ARG user1="someuser"\n', true);
});

describe("ADD", () => {
	test<TestContext>("single file", (context) => {
		context.dockerfile.ADD("package.json", ".");
		testOutputAndValidate(context.dockerfile, "ADD package.json .\n", true);
	});

	test<TestContext>("single ONBUILD", (context) => {
		context.dockerfile.ADD("package.json", ".", { onBuild: true });
		testOutputAndValidate(
			context.dockerfile,
			"ONBUILD ADD package.json .\n",
			true,
		);
	});

	test<TestContext>("single file with spaces in source", (context) => {
		context.dockerfile.ADD("/some/dir ect/package.json", ".");
		testOutputAndValidate(
			context.dockerfile,
			'ADD [ "/some/dir ect/package.json", "." ]\n',
			true,
		);
	});

	test<TestContext>("single file with spaces in destination", (context) => {
		context.dockerfile.ADD("package.json", "/some/ directory");
		testOutputAndValidate(
			context.dockerfile,
			'ADD [ "package.json", "/some/ directory" ]\n',
			true,
		);
	});

	test<TestContext>("multiple files", (context) => {
		context.dockerfile.ADD(["package-lock.json", "package.json"], "./");
		testOutputAndValidate(
			context.dockerfile,
			"ADD package-lock.json package.json ./\n",
			true,
		);
	});

	test<TestContext>("multiple files with spaces in sources", (context) => {
		context.dockerfile.ADD(
			["package-lock.json", "/some/other dir/package.json"],
			"./",
		);
		testOutputAndValidate(
			context.dockerfile,
			'ADD [ "package-lock.json", "/some/other dir/package.json", "./" ]\n',
			true,
		);
	});

	test<TestContext>("multiple files with spaces in destination", (context) => {
		context.dockerfile.ADD(
			["package-lock.json", "/some/other dir/package.json"],
			"/my root dir/",
		);
		testOutputAndValidate(
			context.dockerfile,
			'ADD [ "package-lock.json", "/some/other dir/package.json", "/my root dir/" ]\n',
			true,
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
		testOutputAndValidate(
			context.dockerfile,
			"ADD --keep-git-dir --checksum=sha256:somehash --chown=myuser:mygroup --link --chmod=644 package.json .\n",
			true,
		);
	});
});

test<TestContext>("HEALTHCHECK", (context) => {
	context.dockerfile.HEALTHCHECK("curl -f http://localhost/ || exit 1");
	testOutputAndValidate(
		context.dockerfile,
		"HEALTHCHECK CMD curl -f http://localhost/ || exit 1\n",
		true,
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
	testOutputAndValidate(
		context.dockerfile,
		"HEALTHCHECK --interval=40s --timeout=1s --start-period=10s --start-interval=1s --retries=5 CMD curl -f http://localhost/ || exit 1\n",
		true,
	);
});

test<TestContext>("HEALTHCHECK with build", (context) => {
	context.dockerfile.HEALTHCHECK("curl -f http://localhost/ || exit 1", {
		interval: "40s",
		timeout: "1s",
		startPeriod: "10s",
		startInterval: "1s",
		retries: 5,
		onBuild: true,
	});
	testOutputAndValidate(
		context.dockerfile,
		"ONBUILD HEALTHCHECK --interval=40s --timeout=1s --start-period=10s --start-interval=1s --retries=5 CMD curl -f http://localhost/ || exit 1\n",
		true,
	);
});

test<TestContext>("HEALTHCHECK NONE", (context) => {
	context.dockerfile.HEALTHCHECK("NONE");
	testOutputAndValidate(context.dockerfile, "HEALTHCHECK NONE\n", true);
});

test<TestContext>("LABEL", (context) => {
	context.dockerfile.LABEL({
		key: "com.example.vendor",
		value: "ACME Incorporated",
	});
	testOutputAndValidate(
		context.dockerfile,
		'LABEL "com.example.vendor"="ACME Incorporated"\n',
		true,
	);
});

test<TestContext>("LABEL multiple", (context) => {
	context.dockerfile.LABEL([
		{ key: "com.example.vendor", value: "ACME Incorporated" },
		{ key: "version", value: "1.0" },
	]);
	testOutputAndValidate(
		context.dockerfile,
		`\
LABEL "com.example.vendor"="ACME Incorporated" \\
      "version"="1.0"
`,
		true,
	);
});

test<TestContext>("LABEL ONBUILD", (context) => {
	context.dockerfile.LABEL(
		{ key: "com.example.vendor", value: "ACME Incorporated" },
		{
			onBuild: true,
		},
	);
	testOutputAndValidate(
		context.dockerfile,
		'ONBUILD LABEL "com.example.vendor"="ACME Incorporated"\n',
		true,
	);
});

test<TestContext>("save", (context) => {
	context.dockerfile.FROM("node:20");
	context.dockerfile.WORKDIR("/APP");

	const testPath = path.join(cwd(), "tmp", "dockerfiles", "saved.Dockerfile");
	context.dockerfile.save(testPath);

	expect(readFileSync(testPath).toString()).toStrictEqual(`\
FROM node:20

WORKDIR /APP
`);
});

function testOutputAndValidate(
	df: Dockerfile,
	expected: string,
	includeFrom: boolean = false,
) {
	const contents = df.toString();
	expect(contents).toStrictEqual(expected);
	if (includeFrom) {
		expect(validate(`FROM node:20-slim\n${contents}`)).toStrictEqual([]);
	} else {
		expect(validate(contents)).toStrictEqual([]);
	}
}
