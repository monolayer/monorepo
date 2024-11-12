export const cli = {
	text: "CLI",
	collapsed: true,
	items: [
		{
			text: "db",
			collapsed: true,
			items: [
				{
					text: "create",
					link: "cli/db/create",
				},
				{
					text: "drop",
					link: "cli/db/drop",
				},
				{
					text: "reset",
					link: "cli/db/reset",
				},
				{
					text: "import",
					link: "cli/db/import",
				},
			],
		},
		{
			text: "push",
			collapsed: true,
			items: [
				{
					text: "dev",
					link: "cli/push/dev",
				},
				{
					text: "prod",
					link: "cli/push/prod",
				},
			],
		},
		{
			text: "data",
			collapsed: true,
			items: [
				{
					text: "apply",
					link: "cli/data/apply",
				},
				{
					text: "up",
					link: "cli/data/up",
				},
				{
					text: "down",
					link: "cli/data/down",
				},
				{
					text: "status",
					link: "cli/data/status",
				},
				{
					text: "scaffold",
					link: "cli/data/scaffold",
				},
			],
		},
		{
			text: "seed",
			collapsed: true,
			items: [
				{
					text: "up",
					link: "cli/seed/up",
				},
				{
					text: "scaffold",
					link: "cli/seed/scaffold",
				},
			],
		},
	],
};
