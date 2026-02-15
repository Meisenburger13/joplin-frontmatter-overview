// Can't use import for this library because the types in the library
// are declared incorrectly which result in typescript errors.
// Reference -> https://github.com/jxson/front-matter/issues/76
// eslint-disable-next-line @typescript-eslint/no-var-requires
const frontmatter = require("front-matter");

const escapeLinksInFrontmatter = (note: string) => {
	return note.replace(/: (.*\[.*]\(.*\).*)/g,
		(_, value) => {
			const escaped = value.replace(/"/g, '\\"'); // Escape existing double quotes
			return `: "${escaped}"`;                 // Wrap in quotes
		});
}

/**
 * Returns an object with key-value pairs of the frontmatter properties that
 * are present in both the given note and the given properties.
 *
 * @param note the given note
 * @param properties a string array with property names
 */
export function getFrontmatter(note: string, properties: string[]) {
	note = escapeLinksInFrontmatter(note);
	try {
		const parsedFrontmatter = frontmatter(note);
		return Object.fromEntries(Object.entries(parsedFrontmatter.attributes).filter(([key]) => properties.includes(key)));
	} catch (error) {
		console.error(`frontmatter-overview parsing frontmatter:`, error);
		return {};
	}
}