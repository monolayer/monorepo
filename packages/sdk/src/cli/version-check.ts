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
				`A new version of @monolayer/sdk is available. Current version: ${installedVersion}, Latest version: ${latestVersion}`,
			);
		}
	} catch {
		// Silently fail on network errors or parsing errors
	}
}
