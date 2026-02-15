export interface overviewSettings {
	from: string;
	properties: string[];
	headers: string[];
	sort?: string;
	reverseSort: boolean;
	excludeEmpty: boolean;
	sum: string[];
	count: string[];
	average: string[];
}