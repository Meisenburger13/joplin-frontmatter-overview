import { escapeHtml } from "../utils";

export function linksToHtml(frontmatter: any[]) {
	for (const [key, value] of Object.entries(frontmatter)) {
		if (typeof value !== "string") { continue; }

		const links = value.matchAll(/\[(.*?)]\((.*?)\)/g);
		for (const [mdLink, title, url] of links) {
			const htmlLink = `<a href="${url}">${escapeHtml(title)}</a>`;
			frontmatter[key] = frontmatter[key].replace(mdLink, htmlLink);
		}
	}
	return frontmatter;
}