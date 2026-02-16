import { overviewSettings, RENAME_INFIX } from "../models";

/**
 * Splits properties into original name and rename on the first occurrence
 * of the {@link RENAME_INFIX}.
 *
 * @param properties the given properties
 */
export function getHeaders(properties: overviewSettings["properties"]) {
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