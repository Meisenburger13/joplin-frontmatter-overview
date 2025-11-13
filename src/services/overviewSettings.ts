import * as yaml from "js-yaml";
import { settingsValid, sortValid } from "../utils";
import { LINE_NUM, overviewSettings } from "../models";

export function getOverviewSettings(overview) {
	let overviewSettings = null;
	try {
		overviewSettings = yaml.load(overview) as overviewSettings;
	}
	catch (error) {
		console.log("YAML parsing error:", error);
		return `YAML parsing error: ${error.message}`;
	}
	// check basic structure
	if (!settingsValid(overviewSettings)) {
		return "Invalid overview settings";
	}
	// get aliases
	overviewSettings.properties = overviewSettings.properties.map(prop => {
		const match = prop.match(/^(.+?)\s+AS\s+(.+)$/);
		return match
			? { original: match[1].trim(), alias: match[2].trim() }
			: { original: prop, alias: prop };
	});

	if (overviewSettings.sort && overviewSettings.sort.endsWith(" DESC")) {
		overviewSettings.reverseSort = true;
		overviewSettings.sort = overviewSettings.sort.slice(0, -5);
	}
	// check sort
	if (!sortValid(overviewSettings)) {
		return `Invalid sort parameter: Please check that it matches one of the original property names, except ${LINE_NUM}.`
	}

	return overviewSettings;
}