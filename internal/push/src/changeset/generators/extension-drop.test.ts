import { extension } from "@monorepo/pg/schema/extension.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("drop extension", {
	schema: () => {
		return schema({});
	},
	extensions: [extension("adminpack")],
	expectedQueries: ["create extension if not exists adminpack;"],
});
