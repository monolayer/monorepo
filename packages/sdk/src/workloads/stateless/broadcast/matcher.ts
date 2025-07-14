type RouteParams = { [key: string]: string };

export class RouteMatcher {
	private routes: string[];

	constructor(routes: string[]) {
		this.routes = routes;
	}

	private buildRegex(route: string): RegExp {
		// Escape static segments and convert dynamic segments (e.g., [id]) into capture groups
		const pattern = route
			.split("/")
			.map((segment) => {
				if (segment.startsWith("[") && segment.endsWith("]")) {
					// Capture dynamic segment as a parameter
					return "([^/]+)";
				}
				// Escape static segments
				return segment.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
			})
			.join("/");

		return new RegExp(`^${pattern}$`);
	}

	public match(url: string): { route: string; params: RouteParams } | null {
		for (const route of this.routes) {
			const regex = this.buildRegex(route);
			const match = url.match(regex);
			if (match) {
				// Extract dynamic parameters from the match
				const params: RouteParams = {};
				const segments = route
					.split("/")
					.filter(
						(segment) => segment.startsWith("[") && segment.endsWith("]"),
					);
				const values = match.slice(1);

				segments.forEach((segment, index) => {
					const paramName = segment.slice(1, -1); // Remove the square brackets
					if (values[index]) {
						params[paramName] = values[index];
					}
				});

				return { route, params };
			}
		}
		return null; // No match found
	}
}
