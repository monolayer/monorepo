export async function checkVersion(installedVersion: string): Promise<void> {
	try {
		const response = await fetch(
			"https://registry.npmjs.org/@monolayer/sdk/latest",
		);
		if (!response.ok) {
			// Silently fail if the registry is down
			return;
		}

		const { version: latestVersion } = await response.json();

		if (installedVersion < latestVersion) {
			console.log(
				`\nA new version of @monolayer/sdk is available. Current version: ${installedVersion}, Latest version: ${latestVersion}\n`,
			);
		}
	} catch {
		// Silently fail on network errors or parsing errors
	}
}
