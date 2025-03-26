import joplin from "api";
import {ContentScriptType} from "api/types";
import * as yaml from "js-yaml";
// Can't use import for this library because the types in the library
// are declared incorrectly which result in typescript errors.
// Reference -> https://github.com/jxson/front-matter/issues/76
// eslint-disable-next-line @typescript-eslint/no-var-requires
const frontmatter = require("front-matter");


interface PropertyNames {
	original: string,
	alias: string
}

interface overviewSettings {
	from: string;
	properties: string[] | PropertyNames[];
	sort?: string;
}

function settingsValid(data): data is overviewSettings {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof data.from === "string" &&
        Array.isArray(data.properties) &&
        data.properties.every((item) => typeof item === "string") &&
		(data.sort === undefined || typeof data.sort === "string")
    );
}

function sortValid(overviewSettings) {
	return overviewSettings.sort === undefined ||
		overviewSettings.properties.some( ({original}) => original === overviewSettings.sort)
}

function getOverviewSettings(overview) {
	let overviewSettings = null;
	try {
		overviewSettings = yaml.load(overview) as overviewSettings;
	}
	catch (error) {
		console.log("YAML parsing error:", error);
		return `YAML parsing error: ${error.message}`;
	}
	// check basic structure
	if (!settingsValid(overviewSettings)) {
		return "Invalid overview settings";
	}
	// get aliases
	overviewSettings.properties = overviewSettings.properties.map(prop => {
		const match = prop.match(/^(.+?)\s+AS\s+(.+)$/i);
		return match
			? { original: match[1].trim(), alias: match[2].trim() }
			: { original: prop, alias: prop };
	});
	// check sort
	if (!sortValid(overviewSettings)) {
		return "Invalid sort parameter: Please check that it matches one of the original property names."
	}

	return overviewSettings;
}

async function getNotes(query) {
	let notes = [];
	let pageNum = 1;
	let response;
	do {
		response = await joplin.data.get(["search"], {
			query: query,
			type: "note",
			page: pageNum,
			fields: "id,title,body"
		});
		notes.push(...response["items"]);
		pageNum++;
	} while (response["has_more"])

	// exclude selected note from search
	const selectedNoteId = (await joplin.workspace.selectedNote()).id
	notes = notes.filter((note) => note.id !== selectedNoteId);

	return notes;
}

function getFrontmatter(notes) {
	for (const note of notes) {
		let parsedFrontmatter;
		try {
			parsedFrontmatter = frontmatter(note.body);
		}
		catch (error) {
			const fixedFrontmatter = note.body.replace(
				/:\s*(\[.*?]\(.*?\))/g, // Matches `: [some link](:/...)`
				': "$1"'                // Wraps the value in double quotes
    		);
			try {
				parsedFrontmatter = frontmatter(fixedFrontmatter);
			}
			catch (error){
				console.error(`Error in frontmatter in note: ${note.title}`, error);
				note.frontmatter = {};
				continue;
			}
		}
		note.frontmatter = parsedFrontmatter.attributes;
	}
	return notes;
}

function makeTableOverview(properties, notes) {
	let tableOverview = `<table>
								<tr>
									<td> title </td>
								`;
	for (const prop of properties) {
		tableOverview += `<td> ${prop.alias} </td>`;
	}
	tableOverview += "</tr>";
	for (const note of notes) {
		tableOverview += `
				<tr>
					<td> <a href=":/${note.id}">${note.title}</a> </td>
				`;
		for (const prop of properties) {
			const propValue = note.frontmatter[prop.original] || "";
			tableOverview += `<td> ${propValue} </td>`;
		}
		tableOverview += "</tr>";
	}
	tableOverview += "</table>";
	return tableOverview;
}

async function renderOverview(overview:string) {
	const overviewSettings = getOverviewSettings(overview);
	if (typeof overviewSettings === "string") { return overviewSettings; }
	// get notes
	let notes = await getNotes(overviewSettings.from);
	notes = getFrontmatter(notes);
	// sort notes
	notes.sort((a, b) => {
		if (a.frontmatter[overviewSettings.sort] < b.frontmatter[overviewSettings.sort]) {
			return -1;
		}
		else if (a.frontmatter[overviewSettings.sort] > b.frontmatter[overviewSettings.sort]) {
			return 1;
		}
		return 0;
	})

	return makeTableOverview(overviewSettings.properties, notes);
}


joplin.plugins.register({
	onStart: async function() {
		console.log("frontmatter overview started!")
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			"frontmatter-overview",
			"./contentScript.js"
		);

		await joplin.contentScripts.onMessage("frontmatter-overview", async (overviewString) => {
			const overview = decodeURI(overviewString);
			return await renderOverview(overview);
		});
	},
});