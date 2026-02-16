import * as yaml from "js-yaml";
import {
	LINE_NUM,
	NUM_BACKLINKS,
	NOTE_LINK,
	DESC_SUFFIX,
	RENAME_INFIX,
	overviewSettings
} from "../models";

function normalizeSort(sort: string | string[] | undefined): overviewSettings['sort'] {
	if (!sort) return [];
	if (typeof sort === "string") sort = [sort];
	if (Array.isArray(sort)) {
		return sort.map(item => {
			const trimmed = item.trim();
			if (trimmed.endsWith(DESC_SUFFIX)) {
				return {
					name: trimmed.slice(0, -DESC_SUFFIX.length).trim(),
					reversed: true
				};
			}
			return {
				name: trimmed,
				reversed: false
			};
		});
	}
	return undefined;
}

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
	// sort is normalized before, so should always be an array
	if (!Array.isArray(settings.sort)) {
		return { valid: false, error: "'sort' must be a string or a YAML array" };
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

function sortValid(sort: overviewSettings['sort'], properties: overviewSettings['properties']) {
	if (sort.some(s => s.name === LINE_NUM)) {
		return { valid: false, error: `'sort' cannot be ${LINE_NUM}` };
	}
	if (sort.some(s => properties.every(prop => prop !== s.name))) {
		return { valid: false, error: `every item in 'sort' must match one of the original property names.<br>To reverse the sort, add ' DESC' to the end of the name.` };
	}
	return { valid: true };
}

function sumValid(sum: overviewSettings['sum'], properties: overviewSettings['properties']) {
	if (sum.includes(LINE_NUM) || sum.includes(NOTE_LINK)) {
		return { valid: false, error: `'sum' cannot be used for ${LINE_NUM} or ${NOTE_LINK}` };
	}
	if (sum.some(sumProp => properties.every(prop => prop !== sumProp))) {
		return { valid: false, error: "every item in 'sum' must match one of the original property names." };
	}
	return { valid: true };
}

function countValid(count: overviewSettings['count'], properties: overviewSettings['properties']) {
	if (count.includes(LINE_NUM) || count.includes(NUM_BACKLINKS) || count.includes(NOTE_LINK)) {
		return { valid: false, error: `'count' cannot be used for any of the special properties` };
	}
	if (count.some(countProp => properties.every(prop => prop !== countProp))) {
		return { valid: false, error: "every item in 'count' must match one of the original property names." };
	}
	return { valid: true };
}

function averageValid(average: overviewSettings['average'], properties: overviewSettings['properties']) {
	if (average.includes(LINE_NUM) || average.includes(NOTE_LINK)) {
		return { valid: false, error: `'average' cannot be used for ${LINE_NUM} or ${NOTE_LINK}` };
	}
	if (average.some(averageProp => properties.every(prop => prop !== averageProp))) {
		return { valid: false, error: "every item in 'average' must match one of the original property names." };
	}
	return { valid: true };
}

function getHeaders(properties: string[]) {
	const split = properties.map((property) => {
		const [original, alias] = property.split(RENAME_INFIX).map(s => s.trim());
		return {
			original: original,
			alias: alias || original
		};
	});
	const props = split.map(p => p.original);
	const headers = split.map(p => p.alias);

	return [props, headers];
}

export function getOverviewSettings(overview: string) {
	let parsedYaml: any;
	try {
		parsedYaml = yaml.load(overview);
	}
	catch (error) {
		return `YAML parsing error: ${error.message}`;
	}

	// normalize sort
	parsedYaml.sort = normalizeSort(parsedYaml.sort);
	// validate basic structure
	const areSettingsValid = settingsValid(parsedYaml);
	if (areSettingsValid.valid === false) {
		return "Invalid overview settings: " + areSettingsValid.error;
	}
	const overviewSettings = areSettingsValid.value;

	// get aliases
	[overviewSettings.properties, overviewSettings.headers] = getHeaders(overviewSettings.properties);

	// validate sort
	const isSortValid = sortValid(overviewSettings.sort, overviewSettings.properties);
	if (isSortValid.valid === false) {
		return "Invalid sort parameter: " + isSortValid.error;
	}
	// validate sum
	overviewSettings.sum ??= [];
	const isSumValid = sumValid(overviewSettings.sum, overviewSettings.properties);
	if (isSumValid.valid === false) {
		return "Invalid sum parameter: " + isSumValid.error;
	}
	// validate count
	overviewSettings.count ??= [];
	const isCountValid = countValid(overviewSettings.count, overviewSettings.properties);
	if (isCountValid.valid === false) {
		return "Invalid count parameter: " + isCountValid.error;
	}
	// validate average
	overviewSettings.average ??= [];
	const isAverageValid = averageValid(overviewSettings.average, overviewSettings.properties);
	if (isAverageValid.valid === false) {
		return "Invalid average parameter: " + isAverageValid.error;
	}

	return overviewSettings;
}