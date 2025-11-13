import joplin from "api";
import { isMobilePlatform } from "../utils";

export async function makeImages(notes, width, height) {
	for (const note of notes) {
		for (let [key, value] of Object.entries(note.frontmatter)) {
			if (typeof value !== "string") { continue; }

			let strValue = value as string;
			// Replace images with HTML
			const images = strValue.matchAll(/!\[(.*?)]\(:\/([a-z0-9]{32})\)/g);
			for (const [mdImage, alt, id] of images) {
				const path = await joplin.data.resourcePath(id);
				const imageDiv = document.createElement("div");
				imageDiv.textContent = alt;
				const isMobile = await isMobilePlatform();
				let src:  string;
				if (isMobile) {
					src = `file:///`;
				}
				else {
					src = `joplin-content://note-viewer/`;
				}
				strValue = strValue.replace(mdImage, `<img data-resource-id="${id}" src="${src}${path}" style="max-width: ${width}; max-height: ${height}" alt="${alt}">`);
				note.frontmatter[key] = strValue;
			}
		}
	}
	return notes;
}