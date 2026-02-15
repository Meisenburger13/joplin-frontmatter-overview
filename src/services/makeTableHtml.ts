import { LINE_NUM, NOTE_LINK } from "../models";
import { escapeHtml } from "../utils";

function getPropertyValue(note: any, property: string, line_number: number) {
	let value = note.frontmatter[property];
	if (property === NOTE_LINK) {
		value = `<a href=":/${note.id}">${escapeHtml(note.title)}</a>`;
	} else if (property === LINE_NUM) {
		value = line_number;
	}
	if (value === undefined || value === null) {
		value = "";
	}
	return value;
}

function getSum(property: string, notes: any[]) {
	return notes.reduce((acc, note) => {
		const value = Number(note.frontmatter[property]);
		return acc + (isNaN(value) ? 0 : value);
	}, 0);
}

export async function makeTableHtml(properties: any[], notes: any[], sum: any[]) {
	// make header with aliases
	let tableHtml = "<table><thead><tr>";
	for (const prop of properties) {
		tableHtml += `<td> ${prop.alias} </td>`;
	}
	tableHtml += "</tr></thead>";
	properties = properties.map(prop => prop.original);

	// add one row per note
	for (const note of notes) {
		const index = notes.indexOf(note);
		tableHtml += "<tr>";
		for (const prop of properties) {
			const propValue = getPropertyValue(note, prop, index + 1);
			tableHtml += `<td> ${propValue} </td>`;
		}
		tableHtml += "</tr>";
	}

	// add footer with aggregates
	if (sum.length > 0) {
		tableHtml += "<tfoot><tr>";
		for (let prop of properties) {
			tableHtml += "<td>";
			if (sum.includes(prop)) {
				const sumValue = getSum(prop, notes);
				tableHtml += `<strong>Sum:</strong> ${sumValue}`;
			}
			tableHtml += "</td>";
		}
		tableHtml += "</tr></tfoot>";
	}

	// finish table
	tableHtml += "</table>";
	return tableHtml;
}
