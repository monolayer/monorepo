import { nodeFileTrace } from "@vercel/nft";
import { writeFileSync } from "fs";
import path from "path";

export async function requiredFiles(filePath: string) {
	const { fileList } = await nodeFileTrace([filePath]);
	const requiredFilesPath = path.join(
		path.dirname(filePath),
		"required-files.json",
	);
	writeFileSync(
		requiredFilesPath,
		JSON.stringify(
			{
				version: "1",
				files: Array.from(fileList).filter((f) => f !== filePath),
			},
			null,
			2,
		),
	);
}
