import joplin from "../../api";
import { getOverviewSettings } from "./overviewSettings";
import {
	imagesToHtml,
	linksToHtml,
	getFrontmatter,
	makeTableHtml
} from "../services";
import { getNotes, isMobilePlatform, sortNotes } from "../utils";

export async function renderOverview(overview:string) {
	const pluginSettings = await joplin.settings.values(["width", "height"]);
	const isMobile = await isMobilePlatform();
	const overviewSettings = getOverviewSettings(overview);
	if (typeof overviewSettings === "string") { return overviewSettings; }
	// get notes
	let notes = await getNotes(overviewSettings.from);
	for (const note of notes) {
		note.frontmatter = getFrontmatter(note.body);
	}
	// keep only notes with frontmatter if excludeEmpty
	if (overviewSettings.excludeEmpty) {
		notes = notes.filter(i => Object.keys(i.frontmatter).length > 0);
	}
	// sort notes
	notes.sort((a, b) => { return sortNotes(a, b, overviewSettings.sort) });
	if (overviewSettings.reverseSort) {
		notes = notes.reverse();
	}

	for (const note of notes) {
		// convert images to html
		note.frontmatter = await imagesToHtml(note.frontmatter, isMobile, pluginSettings["width"], pluginSettings["height"]);
		// convert Markdown links to html
		note.frontmatter = linksToHtml(note.frontmatter);
	}

	return makeTableHtml(overviewSettings.properties, notes);
}