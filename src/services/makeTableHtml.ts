import { LINE_NUM, NOTE_LINK, NUM_BACKLINKS } from "../models";
import { escapeHtml } from "../utils";
import joplin from "../../api";

async function getPropertyValue(note: any, property: any, line_number: number) {
	let value = note.frontmatter[property] || "";
	if (property === NOTE_LINK) {
		value = `<a href=":/${note.id}">${escapeHtml(note.title)}</a>`;
	} else if (property === LINE_NUM) {
		value = (line_number).toString();
	} else if (property === NUM_BACKLINKS) {
		let number = 0;
		let pageNum = 1;
		let response: { items: any; has_more: boolean; };
		do {
			response = await joplin.data.get(["search"], {
				query: note.id,
				type: "note",
				page: pageNum,
				fields: "id"
			});
			number += response["items"].length;
			pageNum++;
		} while (response.has_more)
		value = number.toString();
	}
	return value;
}

export async function makeTableHtml(properties: any[], notes: any[]) {
	// make header with aliases
	let tableHtml = "<table><thead><tr>";
	for (const prop of properties) {
		tableHtml += `<td> ${prop.alias} </td>`;
	}
	tableHtml += "</tr></thead>";

	// add one row per note
	for (const note of notes) {
		const index = notes.indexOf(note);
		tableHtml += "<tr>";
		for (const prop of properties) {
			const propValue = await getPropertyValue(note, prop.original, index + 1);
			tableHtml += `<td> ${propValue} </td>`;
		}
		tableHtml += "</tr>";
	}

	// finish table
	tableHtml += "</table>";
	return tableHtml;
}
