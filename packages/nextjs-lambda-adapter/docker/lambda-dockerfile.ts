import { Dockerfile } from "@monolayer/dw";

export function nextJsDockerfile() {
	const df = new Dockerfile();
	df.FROM("public.ecr.aws/lambda/nodejs:22", { as: "base" });
	df.banner("Install dependencies");
	df.FROM("base", { as: "deps" });
	df.COPY(
		[
			"package.json",
			"yarn.lock*",
			"package-lock.json*",
			"pnpm-lock.yaml*",
			".npmrc*",
		],
		"./",
	);
	df.RUN([
		"if [ -f yarn.lock ]; then yarn --frozen-lockfile;",
		"elif [ -f package-lock.json ]; then npm ci;",
		"elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i;",
		'else echo "Lockfile not found." && exit 1;',
		"fi",
	]);

	df.banner("Build app");
	df.FROM("base", { as: "builder" });
	df.COPY(["${LAMBDA_TASK_ROOT}/node_modules"], "./node_modules/", {
		from: "deps",
	});
	df.COPY(["."], "${LAMBDA_TASK_ROOT}/");
	df.ENV("NEXT_PRIVATE_STANDALONE", "true");
	df.RUN("npm run build");
	df.RUN("npx --yes @monolayer/nextjs-lambda-adapter@latest");

	df.banner("Copy app from build");
	df.FROM("base", { as: "runner" });
	df.ENV("NODE_ENV", "production");
	df.COPY(["${LAMBDA_TASK_ROOT}/public"], "./public/", {
		from: "builder",
	});
	df.COPY(["${LAMBDA_TASK_ROOT}/.next/standalone"], "./", {
		from: "builder",
	});
	df.COPY(["${LAMBDA_TASK_ROOT}/.next/static"], "./.next/static/", {
		from: "builder",
	});

	df.CMD(["adapter/index.handler"]);
	return df;
}
