import joplin from "../../api";
import { getOverviewSettings } from "./overviewSettings";
import {
	imagesToHtml,
	linksToHtml,
	getFrontmatter,
	makeTableHtml
} from "../services";
import { getNotes, isMobilePlatform, sortNotes } from "../utils";

async function getResourcePath(id: string) {
	return await joplin.data.resourcePath(id);
}

export async function renderOverview(overview: string) {
	const { width, height } = await joplin.settings.values(["width", "height"]);
	const isMobile = await isMobilePlatform();

	const overviewSettings = getOverviewSettings(overview);
	if (typeof overviewSettings === "string") { return overviewSettings; }

	let notes = await getNotes(overviewSettings.from);

	// parse frontmatter
	for (const note of notes) {
		note.frontmatter = getFrontmatter(note.body);
	}

	// filter empty?
	if (overviewSettings.excludeEmpty) {
		notes = notes.filter(note => Object.keys(note.frontmatter).length > 0);
	}

	// sort
	notes.sort((a, b) => sortNotes(a, b, overviewSettings.sort));
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