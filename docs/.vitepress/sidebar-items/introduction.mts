export const introduction = {
	text: "Introduction",
	collapsed: false,
	items: [
		{
			text: "What is monolayer?",
			link: "introduction/what-is-monolayer",
		},
		{
			text: "Installation",
			link: "introduction/installation",
		},
		{
			text: "Your first schema",
			link: "introduction/first-schema",
		},
		{
			text: "Querying the database",
			link: "introduction/querying/kysely",
			items: [
				{
					text: "Kysely",
					link: "introduction/querying/kysely",
				},
				{
					text: "Prisma",
					link: "introduction/querying/prisma",
				},
			],
		},
	],
};
