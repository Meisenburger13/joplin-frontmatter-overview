export function linksToHtml(frontmatter: any[]) {
	for (const [key, value] of Object.entries(frontmatter)) {
		if (typeof value !== "string") { continue; }

		const links = value.matchAll(/\[(.*?)]\((.*?)\)/g);
		for (const [mdLink, title, url] of links) {
			const titleDiv = document.createElement("div");
			titleDiv.textContent = title;
			const htmlLink = `<a href="${url}">${titleDiv.innerHTML}</a>`;
			frontmatter[key] = frontmatter[key].replace(mdLink, htmlLink);
		}
	}
	return frontmatter;
}