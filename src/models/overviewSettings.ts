import { propertyNames } from "../models";

export interface overviewSettings {
	from: string;
	properties: string[] | propertyNames[];
	sort?: string;
	reverseSort: boolean;
	excludeEmpty?: boolean;
}