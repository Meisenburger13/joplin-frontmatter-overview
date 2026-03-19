import { DESC_SUFFIX, overviewSettings } from "../models";

function normalizeSort(yaml: any): overviewSettings['sort'] {
	if (!('sort' in yaml)) return [];

	let sort = yaml.sort;
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

export function normalizeSettings(yaml: any) {
	if (yaml == null) return;

	yaml.sort = normalizeSort(yaml);
	const keys = ["average", "count", "sum"] as const;

	for (const key of keys) {
		const value = yaml?.[key];
		yaml[key] =
			typeof value === "string"
			? [value]
			: Array.isArray(value)
			? value
			: [];
	}
	return yaml;
}