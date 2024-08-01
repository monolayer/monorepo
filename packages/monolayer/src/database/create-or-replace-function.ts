import { sql, type RawBuilder } from "kysely";
import nunjucks from "nunjucks";

export function createOrReplaceFunction({
	schema,
	fn,
	name,
	dataIn,
	dataOut,
}: {
	schema: string;
	name: string;
	dataIn: "text" | "JSONB";
	dataOut: "text" | "JSONB";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fn: (value: any) => any;
}): RawBuilder<unknown> {
	const renderedFn = template.render({
		schema,
		name,
		dataIn,
		dataOut,
		fn: fn.toString(),
	});
	// writeFileSync(path.join(tmpPath, "output.sql"), renderedFn);
	return sql`${sql.raw(renderedFn)}`;
}

const template = nunjucks.compile(`
DROP FUNCTION IF EXISTS {{ schema }}.{{ name }}(value {{ dataIn }});
CREATE OR REPLACE FUNCTION {{ schema }}.{{ name }}(value {{ dataIn }}) RETURNS {{ dataOut }} AS $$
{{ fn | safe }}

return {{ name }}(value)

$$ LANGUAGE plv8 IMMUTABLE STRICT;
`);

// async function plv8ify(inputPath: string, schemaName: string, name: string) {
// 	const outputPath = path.join(cwd(), "tmp", `${name}.plv8.sql`);
// 	await execa("npx", [
// 		"plv8ify",
// 		"generate",
// 		"--input-file",
// 		inputPath,
// 		"--output-folder",
// 		path.join(cwd(), "tmp", "build"),
// 	]);
// 	return readFileSync(outputPath, "utf8")
// 		.replace(
// 			"DROP FUNCTION IF EXISTS ",
// 			`DROP FUNCTION IF EXISTS ${schemaName}.`,
// 		)
// 		.replace(
// 			"CREATE OR REPLACE FUNCTION ",
// 			`CREATE OR REPLACE FUNCTION ${schemaName}.`,
// 		);
// }
