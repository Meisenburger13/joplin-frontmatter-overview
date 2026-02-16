import { NOTE_LINK } from "../models";

function compareValues(a: any, b: any) {
	const isValueANumeric = !isNaN(Number(a));
	const isValueBNumeric = !isNaN(Number(b));
	if (isValueANumeric && isValueBNumeric) {
		// Both are numbers → compare numerically
		return Number(a) - Number(b);
	}
	if (typeof a === "string" && typeof b === "string") {
		// Both are strings → compare using localeCompare
		return a.localeCompare(b, undefined, { numeric: true });
	}
	if (isValueANumeric) {
		// One is a number, the other is a string → prioritize numbers
		return -1;
	}
	if (isValueBNumeric) {
		return 1;
	}
	return 0;
}

export function compareNotes(noteA: any, noteB: any, sort: { name: string, reversed: boolean }[]) {
	for (const rule of sort) {
		let valueA: any;
		let valueB: any;

		if (rule.name === NOTE_LINK) {
			valueA = noteA.title ?? "";
			valueB = noteB.title ?? "";
		} else {
			valueA = noteA.frontmatter[rule.name] ?? "";
			valueB = noteB.frontmatter[rule.name] ?? "";
		}

		const result = compareValues(valueA, valueB);

		if (result !== 0) {
			return rule.reversed ? -result : result;
		}
	}
	// All sort fields equal
	return 0;
}