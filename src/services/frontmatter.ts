// Can't use import for this library because the types in the library
// are declared incorrectly which result in typescript errors.
// Reference -> https://github.com/jxson/front-matter/issues/76
// eslint-disable-next-line @typescript-eslint/no-var-requires
const frontmatter = require("front-matter");

export function getFrontmatter(notes) {
	for (const note of notes) {
		let parsedFrontmatter;
		const wrapLinksInFm = note.body.replace(
			/: (.*\[.*]\(.*\).*)/g,
			(_match, p1) => {
				const escaped = p1.replace(/"/g, '\\"'); // Escape existing double quotes
				return `: "${escaped}"`;                 // Wrap in quotes
			}
		);
		try {
			parsedFrontmatter = frontmatter(wrapLinksInFm);
		}
		catch (error){
			console.error(`Error in frontmatter in note: ${note.title}`, error);
			note.frontmatter = {};
			continue;
		}
		note.frontmatter = parsedFrontmatter.attributes;
	}
	return notes;
}