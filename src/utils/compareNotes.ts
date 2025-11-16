import { NOTE_LINK } from "../models";

export function compareNotes(noteA: any, noteB: any, sort: string) {
	let valueA: string, valueB: string;

	if (sort === NOTE_LINK) {
		valueA = noteA.title;
		valueB = noteB.title;
	} else {
		valueA = noteA.frontmatter[sort] ?? "";
		valueB = noteB.frontmatter[sort] ?? "";
	}

	const isValueANumeric = !isNaN(Number(valueA));
	const isValueBNumeric = !isNaN(Number(valueB));
	if (isValueANumeric && isValueBNumeric) {
		// Both are numbers → compare numerically
		return Number(valueA) - Number(valueB);
	} else if (typeof valueA === "string" && typeof valueB === "string") {
		// Both are strings → compare using localeCompare
		return valueA.localeCompare(valueB, undefined, { numeric: true });
	} else if (isValueANumeric) {
		// One is a number, the other is a string → prioritize numbers
		return -1;
	} else {
		return 1;
	}
}