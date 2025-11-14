import * as yaml from "js-yaml";
import {
	LINE_NUM,
	DESC_SUFFIX,
	overviewSettings,
	RENAME_INFIX
} from "../models";

function settingsValid(settings: overviewSettings): settings is overviewSettings {
    return (
        typeof settings === "object" &&
        settings !== null &&
        typeof settings.from === "string" &&
        Array.isArray(settings.properties) &&
        settings.properties.every((item) => typeof item === "string") &&
		(settings.sort === undefined || typeof settings.sort === "string") &&
		(settings.excludeEmpty === undefined || typeof settings.excludeEmpty === "boolean")
    );
}

function sortValid(overviewSettings: overviewSettings) {
	return (overviewSettings.sort === undefined ||
		overviewSettings.properties.some( (prop) => prop.original === overviewSettings.sort))
	&& overviewSettings.sort !== LINE_NUM
}

function getAliases(properties: string[]) {
	return properties.map((property) => {
		const [original, alias] = property.split(RENAME_INFIX).map(s => s.trim());
		return {
			original: original,
			alias: alias || original
		};
	});
}

export function getOverviewSettings(overview: string) {
	let parsedYaml: any;
	try {
		parsedYaml = yaml.load(overview);
	}
	catch (error) {
		console.log("YAML parsing error:", error);
		return `YAML parsing error: ${error.message}`;
	}

	// validate basic structure
	if (!settingsValid(parsedYaml)) {
		return "Invalid overview settings";
	}

	// type predicated
	const overviewSettings = parsedYaml;

	// get aliases
	overviewSettings.properties = getAliases(overviewSettings.properties);

	// sort DESC?
	if (overviewSettings.sort && overviewSettings.sort.endsWith(DESC_SUFFIX)) {
		overviewSettings.reverseSort = true;
		overviewSettings.sort = overviewSettings.sort.slice(0, -DESC_SUFFIX.length).trim();
	}

	// validate sort
	if (!sortValid(overviewSettings)) {
		return `Invalid sort parameter: Please check that it matches one of the original property names, except ${LINE_NUM}.`
	}

	return overviewSettings;
}