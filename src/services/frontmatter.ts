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

export function getFrontmatter(note: string) {
	note = escapeLinksInFrontmatter(note);
	try {
		const parsedFrontmatter = frontmatter(note);
		return parsedFrontmatter.attributes;
	}
	catch (error){
		console.error(`Error while parsing frontmatter`, error);
		return {};
	}
}