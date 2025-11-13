export function makeLinks(notes) {
	for (const note of notes) {
		for (let [key, value] of Object.entries(note.frontmatter)) {
			if (typeof value === "string") {
				let strValue = value as string;
				// Replace Markdown links with HTML links
				const links = strValue.matchAll(/\[(.*?)]\((.*?)\)/g);
				for (const [mdLink, title, url] of links) {
					const titleDiv = document.createElement("div");
					titleDiv.textContent = title;
					strValue = strValue.replace(mdLink, `<a href="${url}">${titleDiv.innerHTML}</a>`);
					note.frontmatter[key] = strValue;
				}
			}
		}
	}
	return notes;
}