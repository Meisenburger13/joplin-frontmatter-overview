import * as yaml from "js-yaml";
import {
	LINE_NUM,
	NUM_BACKLINKS,
	NOTE_LINK,
	DESC_SUFFIX,
	RENAME_INFIX,
	overviewSettings
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
	if (settings.sum !== undefined && !Array.isArray(settings.sum)) {
		return { valid: false, error: "'sum' must be a valid YAML array" };
	}
	if (settings.count !== undefined && !Array.isArray(settings.count)) {
		return { valid: false, error: "'count' must be a valid YAML array" };
	}
	if (settings.average !== undefined && !Array.isArray(settings.average)) {
		return { valid: false, error: "'average' must be a valid YAML array" };
	}
	return { valid: true, value: settings };
}

function sortValid(overviewSettings: overviewSettings) {
	const sort = overviewSettings.sort;
	if (sort === undefined ) {
		return { valid: true };
	}
	if (sort === LINE_NUM) {
		return { valid: false, error: `'sort' cannot be ${LINE_NUM}` };
	}
	if (overviewSettings.properties.every(prop => prop.original !== sort)) {
		return { valid: false, error: `'sort' must match one of the original property names.<br>To reverse the sort, add ' DESC' to the end of the name.` };
	}
	return { valid: true };
}

function sumValid(overviewSettings: overviewSettings) {
	const sum = overviewSettings.sum;
	if (sum === undefined) {
		return { valid: true };
	}
	if (sum.includes(LINE_NUM) || sum.includes(NOTE_LINK)) {
		return { valid: false, error: `'sum' cannot be used for ${LINE_NUM} or ${NOTE_LINK}` };
	}
	if (sum.some(sumProp => overviewSettings.properties.every(prop => prop.original !== sumProp))) {
		return { valid: false, error: "every item in 'sum' must match one of the original property names." };
	}
	return { valid: true };
}

function countValid(overviewSettings: overviewSettings) {
	const count = overviewSettings.count;
	if (count === undefined) {
		return { valid: true };
	}
	if (count.includes(LINE_NUM) || count.includes(NUM_BACKLINKS) || count.includes(NOTE_LINK)) {
		return { valid: false, error: `'count' cannot be used for any of the special properties` };
	}
	if (count.some(countProp => overviewSettings.properties.every(prop => prop.original !== countProp))) {
		return { valid: false, error: "every item in 'count' must match one of the original property names." };
	}
	return { valid: true };
}

function averageValid(overviewSettings: overviewSettings) {
	const average = overviewSettings.average;
	if (average === undefined) {
		return { valid: true };
	}
	if (average.includes(LINE_NUM) || average.includes(NOTE_LINK)) {
		return { valid: false, error: `'average' cannot be used for ${LINE_NUM} or ${NOTE_LINK}` };
	}
	if (average.some(averageProp => overviewSettings.properties.every(prop => prop.original !== averageProp))) {
		return { valid: false, error: "every item in 'average' must match one of the original property names." };
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
	const overviewSettings = areSettingsValid.value;

	// get aliases
	overviewSettings.properties = getAliases(overviewSettings.properties);

	// sort DESC?
	if (overviewSettings.sort && overviewSettings.sort.endsWith(DESC_SUFFIX)) {
		overviewSettings.reverseSort = true;
		overviewSettings.sort = overviewSettings.sort.slice(0, -DESC_SUFFIX.length).trim();
	}

	// validate sort
	const isSortValid = sortValid(overviewSettings);
	if (isSortValid.valid === false) {
		return "Invalid sort parameter: " + isSortValid.error;
	}
	// validate sum
	const isSumValid = sumValid(overviewSettings);
	if (isSumValid.valid === false) {
		return "Invalid sum parameter: " + isSumValid.error;
	}
	// validate count
	const isCountValid = countValid(overviewSettings);
	if (isCountValid.valid === false) {
		return "Invalid count parameter: " + isCountValid.error;
	}

	const isAverageValid = averageValid(overviewSettings);
	if (isAverageValid.valid === false) {
		return "Invalid average parameter: " + isAverageValid.error;
	}

	return overviewSettings;
}