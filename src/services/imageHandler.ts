import joplin from "api";
import { escapeHtml } from "../utils";

export async function imagesToHtml(frontmatter: any[], isMobile: boolean, width: any, height: any) {
	for (const [key, value] of Object.entries(frontmatter)) {
		if (typeof value !== "string") { continue; }

		const images = value.matchAll(/!\[(.*?)]\(:\/([a-z0-9]{32})\)/g);
		for (const [mdImage, alt, id] of images) {
			const path = await joplin.data.resourcePath(id);
			const src = isMobile ? "file:///" : "joplin-content://note-viewer/";
			const htmlImage = `<img data-resource-id="${id}" src="${src}${path}" style="max-width: ${width}; max-height: ${height}" alt="${escapeHtml(alt)}">`;
			frontmatter[key] = frontmatter[key].replace(mdImage, htmlImage);
		}
	}
	return frontmatter;
}