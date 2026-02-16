import joplin from "../../api";
import { getOverviewSettings } from "./overviewSettings";
import {
	getFrontmatter,
	makeTableHtml
} from "../services";
import {
	compareNotes,
	getNotes,
	imagesToHtml,
	isMobilePlatform,
	linksToHtml
} from "../utils";
import { NUM_BACKLINKS } from "../models";

/**
 * Main method of the plugin, calls other methods to validate, parse and render
 * the overview.
 *
 * @param overview the given content of the overview block
 */
export async function renderOverview(overview: string) {
	const { width, height } = await joplin.settings.values(["width", "height"]);
	const isMobile = await isMobilePlatform();

	const overviewSettings = getOverviewSettings(overview);
	if (typeof overviewSettings === "string") return overviewSettings;

	let notes = await getNotes(overviewSettings.from);

	// parse frontmatter
	for (const note of notes) {
		note.frontmatter = getFrontmatter(note.body, overviewSettings.properties);
	}

	// exclude empty?
	if (overviewSettings.excludeEmpty) {
		notes = notes.filter(note => Object.keys(note.frontmatter).length > 0);
	}

	// get num_backlinks for sort
	if (overviewSettings.properties.some(prop => prop === NUM_BACKLINKS)) {
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
			})
		);
	}

	// sort
	notes.sort((a, b) => compareNotes(a, b, overviewSettings.sort));

	// transform notes
	for (const note of notes) {
		// convert images to html
		note.frontmatter = await imagesToHtml(
			note.frontmatter,
			isMobile,
			width,
			height
		);
		// convert links to html
		note.frontmatter = linksToHtml(note.frontmatter);
	}

	return makeTableHtml(overviewSettings, notes);
}