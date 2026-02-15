import joplin from "../../api";
import { getOverviewSettings } from "./overviewSettings";
import {
	imagesToHtml,
	linksToHtml,
	getFrontmatter,
	makeTableHtml
} from "../services";
import { getNotes, isMobilePlatform, compareNotes } from "../utils";
import { NUM_BACKLINKS } from "../models";

async function getResourcePath(id: string) {
	return joplin.data.resourcePath(id).catch(error => {
		console.error("resource not available", error);
		return "";
	});
}

export async function renderOverview(overview: string) {
	const { width, height } = await joplin.settings.values(["width", "height"]);
	const isMobile = await isMobilePlatform();

	const overviewSettings = getOverviewSettings(overview);
	if (typeof overviewSettings === "string") { return overviewSettings; }
	const originalPropertyNames = overviewSettings.properties.map(p => p.original);

	let notes = await getNotes(overviewSettings.from);

	// parse frontmatter
	for (const note of notes) {
		note.frontmatter = getFrontmatter(note.body, originalPropertyNames);
	}

	// filter empty?
	if (overviewSettings.excludeEmpty) {
		notes = notes.filter(note => {
			const frontmatterProperties = Object.keys(note.frontmatter);
			return frontmatterProperties.some(key => originalPropertyNames.includes(key));
		});
	}

	// get num_backlinks for sort
	if (overviewSettings.properties.some(prop => prop.original === NUM_BACKLINKS)) {
		await Promise.all(
			notes.map(async (note) => {
				let num_backlinks = 0;
				let pageNum = 1;
				let response: { items: any; has_more: boolean };

				do {
					response = await joplin.data.get(["search"], {
						query: note.id,
						type: "note",
						page: pageNum,
						fields: "id"
					});
					num_backlinks += response.items.length;
					pageNum++;
				} while (response.has_more);

				note.frontmatter[NUM_BACKLINKS] = num_backlinks;
			}
		)
    );
	}

	// sort
	notes.sort((a, b) => compareNotes(a, b, overviewSettings.sort));
	if (overviewSettings.reverseSort) notes.reverse();

	// transform notes
	for (const note of notes) {
		// convert images to html
		note.frontmatter = await imagesToHtml(
			note.frontmatter,
			isMobile,
			width,
			height,
			getResourcePath
		);
		// convert links to html
		note.frontmatter = linksToHtml(note.frontmatter);
	}

	return makeTableHtml(overviewSettings.properties, notes);
}