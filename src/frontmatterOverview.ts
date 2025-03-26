import * as yaml from "js-yaml";

// Can't use import for this library because the types in the library
// are declared incorrectly which result in typescript errors.
// Reference -> https://github.com/jxson/front-matter/issues/76
// eslint-disable-next-line @typescript-eslint/no-var-requires
const frontmatter = require("front-matter");
document.addEventListener("joplin-noteDidUpdate", renderOverview);

declare const webviewApi: {
	postMessage(contentScriptId: string, arg: unknown): Promise<any>;
};

function renderContent(content, overview) {
	overview.innerHTML = content;
}

interface PropertyNames {
	original: string,
	alias: string
}

interface overviewSettings {
	from: string;
	properties: string[] | PropertyNames[];
	sort?: string;
}

function getOverviewSettings(overview) {
	let overviewSettings = null;
	try {
		overviewSettings = yaml.load(overview.textContent) as overviewSettings;
	}
	catch (error) {
		console.log("YAML parsing error:", error);
		return renderContent(`YAML parsing error: ${error.message}`, overview);
	}
	// check basic structure
	if (!settingsValid(overviewSettings)) {
		return renderContent("Invalid overview settings", overview);
	}
	// get aliases
	overviewSettings.properties = overviewSettings.properties.map(prop => {
		const match = (prop as string).match(/^(.+?)\s+AS\s+(.+)$/i);
		return match
			? { original: match[1].trim(), alias: match[2].trim() }
			: { original: prop, alias: prop };
	});
	// check sort
	if (!(overviewSettings.properties as PropertyNames[]).some( ({original}) => original === overviewSettings.sort)) {
		return renderContent("Invalid sort parameter: Please check that it matches one of the original parameter names.", overview);
	}

	return overviewSettings;
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

async function renderOverview() {
	const overviews = document.getElementsByClassName("frontmatter-overview");

    for (const overview of overviews){
		const overviewSettings = getOverviewSettings(overview);
		if (!overviewSettings) { continue; }
		// get notes
		let notes = await webviewApi.postMessage("frontmatter-overview", overviewSettings.from);
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

 		let tableOverview = makeTableOverview(overviewSettings.properties, notes);

		renderContent(tableOverview, overview);
	}
}