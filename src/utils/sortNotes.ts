import { NOTE_LINK } from "../models/constants";

export function sortNotes(a, b, sort) {
	let valueA, valueB;

	if (sort === NOTE_LINK) {
		valueA = a.title;
		valueB = b.title;
	} else {
		valueA = a.frontmatter[sort] ?? "";
		valueB = b.frontmatter[sort] ?? "";
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