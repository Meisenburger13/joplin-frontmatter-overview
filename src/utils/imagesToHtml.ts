import { escapeHtml } from "../utils";
import joplin from "../../api";

async function getResourcePath(id: string) {
	return joplin.data.resourcePath(id).catch(error => {
		console.error("frontmatter-overview get resource:", error);
		return "";
	});
}

/**
 * Turns any markdown image in the given frontmatter into an html image
 * with the desired size.
 * The path is set so that it renders correctly on mobile and other devices
 * (though the web viewer probably doesn't work).
 * Also sets the alt tag to the original name of the image in case the table
 * is turned into markdown later on.
 *
 * @param frontmatter the given frontmatter
 * @param isMobile {@code true} if overview is rendered on mobile, otherwise {@code false}
 * @param width the desired width of the image
 * @param height the desired height of the image
 */
export async function imagesToHtml(frontmatter: any[], isMobile: boolean, width: any, height: any) {
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