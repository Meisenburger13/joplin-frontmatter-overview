import * as yaml from "js-yaml";
import {
	LINE_NUM,
	DESC_SUFFIX,
	overviewSettings,
	RENAME_INFIX
} from "../models";

function settingsValid(settings: any):
	{ valid: true, value: overviewSettings } | { valid: false, error: string }
{
	if (typeof settings !== "object" || settings === undefined || settings.from === undefined || settings.properties === undefined) {
		return { valid: false, error: "'from' and 'properties' are required for overview" };
	}
	if (typeof settings.from !== "string") {
		return { valid: false, error: "'from' parameter must be a string" };
	}
	if (!Array.isArray(settings.properties)) {
		return { valid: false, error: "'properties' must be valid YAML array" };
	}
	if (settings.properties.some((item: any) => typeof item !== "string")) {
		return { valid: false, error: "'properties' values must be strings, try enclosing them in quotation marks" };
	}
	if (settings.sort !== undefined && typeof settings.sort !== "string") {
		return { valid: false, error: "'sort' must be a string, try enclosing the value in quotation marks" };
	}
	if (settings.excludeEmpty !== undefined && typeof settings.excludeEmpty !== "boolean") {
		return { valid: false, error: "'excludeEmpty' must be a boolean" };
	}
	return { valid: true, value: settings };
}

function sortValid(overviewSettings: overviewSettings) {
	if (overviewSettings.sort === undefined ) {
		return { valid: true };
	}
	if (overviewSettings.sort === LINE_NUM) {
		return { valid: false, error: `'sort' cannot be ${LINE_NUM}` };
	}
	if (overviewSettings.properties.every(prop => prop.original !== overviewSettings.sort)) {
		return { valid: false, error: `'sort' must match one of the original property names.<br>To reverse the sort, add ' DESC' to the end of the name.` };
	}
	return { valid: true };
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
		return `YAML parsing error: ${error.message}`;
	}

	// validate basic structure
	const areSettingsValid = settingsValid(parsedYaml);
	if (areSettingsValid.valid === false) {
		return "Invalid overview settings: " + areSettingsValid.error;
	}

	// type predicated
	const overviewSettings = areSettingsValid.value;

	// get aliases
	overviewSettings.properties = getAliases(overviewSettings.properties);

	// sort DESC?
	if (overviewSettings.sort && overviewSettings.sort.endsWith(DESC_SUFFIX)) {
		overviewSettings.reverseSort = true;
		overviewSettings.sort = overviewSettings.sort.slice(0, -DESC_SUFFIX.length).trim();
	}

	// validate sort
	const isSortValid = sortValid(overviewSettings)
	if (isSortValid.valid === false) {
		return "Invalid sort parameter: " + isSortValid.error;
	}

	return overviewSettings;
}