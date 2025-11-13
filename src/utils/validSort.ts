import { overviewSettings } from "../models/overviewSettings";
import { LINE_NUM } from "../models/constants";

export function sortValid(overviewSettings: overviewSettings) {
	return (overviewSettings.sort === undefined ||
		overviewSettings.properties.some( (prop) => prop.original === overviewSettings.sort))
	&& overviewSettings.sort !== LINE_NUM
}