export interface overviewSettings {
	from: string;
	properties: string[];
	headers: string[];
	sort: {
		name: string,
		reversed: boolean
	}[];
	excludeEmpty: boolean;
	sum: string[];
	count: string[];
	average: string[];
}