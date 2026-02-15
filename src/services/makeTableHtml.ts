import { LINE_NUM, NOTE_LINK, overviewSettings } from "../models";
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

function getCount(property: string, notes: any[]) {
	return notes.reduce((acc, note) => {
		return acc + (property in (note.frontmatter) ? 1 : 0);
	}, 0);
}

function getAverage(property: string, notes: any[]) {
	const values = notes
		.map(note => Number(note.frontmatter[property]))
		.filter(v => !isNaN(v));
	return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
}

export async function makeTableHtml(overview: overviewSettings, notes: any[]) {
	// make header with aliases
	let tableHtml = "<table><thead><tr>";
	for (const header of overview.headers) {
		tableHtml += `<td> ${header} </td>`;
	}
	tableHtml += "</tr></thead>";

	// add one row per note
	for (const note of notes) {
		const index = notes.indexOf(note);
		tableHtml += "<tr>";
		for (const prop of overview.properties) {
			const propValue = getPropertyValue(note, prop, index + 1);
			tableHtml += `<td> ${propValue} </td>`;
		}
		tableHtml += "</tr>";
	}

	// add footer with aggregates
	if (overview.sum.length > 0 || overview.count.length > 0 || overview.average.length > 0) {
		tableHtml += "<tfoot><tr>";
		for (let prop of overview.properties) {
			tableHtml += "<td>";
			if (overview.count.includes(prop)) {
				const countValue = getCount(prop, notes);
				tableHtml += `<strong>Count:</strong> ${countValue} <br>`;
			}
			if (overview.sum.includes(prop)) {
				const sumValue = getSum(prop, notes);
				tableHtml += `<strong>Sum:</strong> ${sumValue} <br>`;
			}
			if (overview.average.includes(prop)) {
				const averageValue = getAverage(prop, notes);
				tableHtml += `<strong>Average:</strong> ${averageValue} <br>`;
			}
			tableHtml += "</td>";
		}
		tableHtml += "</tr></tfoot>";
	}

	// finish table
	tableHtml += "</table>";
	return tableHtml;
}
