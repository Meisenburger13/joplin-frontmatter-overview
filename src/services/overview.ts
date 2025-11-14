import joplin from "../../api";
import { getOverviewSettings } from "./overviewSettings";
import { makeImages, makeLinks, getFrontmatter } from "../services";
import { getNotes, sortNotes } from "../utils";
import { LINE_NUM, NOTE_LINK } from "../models";

function makeTableOverview(properties, notes) {
	let tableOverview = "<table><thead>";
	for (const prop of properties.map(subarray => subarray["alias"])) {
		tableOverview += `<td> ${prop} </td>`;
	}
	tableOverview += "</thead>";
	notes.forEach((note, index)  => {
		for (const prop of properties.map(subarray => subarray["original"])) {
			let propValue = note.frontmatter[prop] || "";
			if (prop === NOTE_LINK) {
				const titleDiv = (document.createElement("div"));
				titleDiv.textContent = note.title;
				propValue = `<a href=":/${note.id}">${titleDiv.innerHTML}</a>`;
			}
			else if (prop === LINE_NUM) {
				propValue = (index + 1).toString();
			}
			tableOverview += `<td> ${propValue} </td>`;
		}
		tableOverview += "</tr>";
	});
	tableOverview += "</table>";
	return tableOverview;
}

export async function renderOverview(overview:string) {
	const pluginSettings = await joplin.settings.values(["width", "height"]);
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
	// convert images to html
	notes = await makeImages(notes, pluginSettings["width"], pluginSettings["height"]);
	// convert Markdown links to html
	notes = makeLinks(notes);

	return makeTableOverview(overviewSettings.properties, notes);
}