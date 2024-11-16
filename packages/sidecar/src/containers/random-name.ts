import {
	Config,
	adjectives,
	animals,
	names,
	uniqueNamesGenerator,
} from "unique-names-generator";

const config: Config = {
	dictionaries: [adjectives, names, animals],
};

export const randomName = () => uniqueNamesGenerator(config);
