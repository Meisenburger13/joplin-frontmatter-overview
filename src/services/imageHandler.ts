import { escapeHtml } from "../utils";

export async function imagesToHtml(frontmatter: any[], isMobile: boolean, width: any, height: any, getResourcePath: (id: string) => Promise<string>) {
	for (const [key, value] of Object.entries(frontmatter)) {
		if (typeof value !== "string") { continue; }

		const images = value.matchAll(/!\[(.*?)]\(:\/([a-z0-9]{32})\)/g);
		for (const [mdImage, alt, id] of images) {
			const path = await getResourcePath(id);
			const src = isMobile ? "file:///" : "joplin-content://note-viewer/";
			const htmlImage = `<img data-resource-id="${id}" src="${src}${path}" style="max-width: ${width}; max-height: ${height}" alt="${escapeHtml(alt)}">`;
			frontmatter[key] = frontmatter[key].replace(mdImage, htmlImage);
		}
	}
	return frontmatter;
}