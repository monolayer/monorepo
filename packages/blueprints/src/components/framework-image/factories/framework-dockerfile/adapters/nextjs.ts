import { Dockerfile } from "@monolayer/dw";
import {
	baseStageNode22Alpine320,
	buildStage,
	npmDependenciesStage,
} from "../../../../../lib/dockerfile-helpers";

export class NextJs {
	dockerfile() {
		const dockerfile = new Dockerfile();

		dockerfile.append(baseStageNode22Alpine320({ as: "base" }));
		dockerfile.append(npmDependenciesStage({ from: "base" }));
		dockerfile.append(buildStage({ from: "base", copyFrom: "deps" }));

		dockerfile.banner("Production server image stage");
		dockerfile.FROM("base", { as: "runner" });

		dockerfile.WORKDIR("/app");

		dockerfile.comment("Copy build output");
		dockerfile.group(() => {
			dockerfile.COPY("/app/public", "./public", { from: "builder" });
			dockerfile.COPY("/app/.next/standalone", "./", { from: "builder" });
			dockerfile.COPY("/app/.next/static", "./.next/static", { from: "builder" });
		});

		dockerfile.ENV("NODE_ENV", "production");
		dockerfile.ENV("PORT", "3000");
		dockerfile.ENV("HOSTNAME", "0.0.0.0");

		dockerfile.EXPOSE(3000);

		dockerfile.ENTRYPOINT("node", ["server.js"]);

		return dockerfile;
	}
}
