import * as yaml from 'js-yaml';

// Can't use import for this library because the types in the library
// are declared incorrectly which result in typescript errors.
// Reference -> https://github.com/jxson/front-matter/issues/76
// eslint-disable-next-line @typescript-eslint/no-var-requires
const frontmatter = require("front-matter");
document.addEventListener('joplin-noteDidUpdate', renderOverview);

declare const webviewApi: {
	postMessage(contentScriptId: string, arg: unknown): Promise<any>;
};

function renderContent(content, overview) {
	overview.innerHTML = content;
}

interface overviewSettings {
	from: string;
	properties: string[];
	sort?: string;
}

function settingsValid(data: any): data is overviewSettings {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.from === 'string' &&
        Array.isArray(data.properties) &&
        data.properties.every((item) => typeof item === 'string') &&
		(data.sort === undefined || (typeof data.sort === 'string' && data.properties.includes(data.sort)))
    );
}

function getFrontmatter(notes) {
	for (const note of notes) {
		try {
			const parsedFrontmatter = frontmatter(note.body);
			note.frontmatter = parsedFrontmatter.attributes;
		}
		catch (error) {
			const fixedFrontmatter = note.body.replace(
				/:\s*(\[.*?]\(.*?\))/g, // Matches `: [some link](:/...)`
				': "$1"'                // Wraps the value in double quotes
    		);
			const parsedFrontmatter = frontmatter(fixedFrontmatter);
			note.frontmatter = parsedFrontmatter.attributes;
		}
	}
	return notes;
}

function makeTableOverview(properties, notes) {
	let tableOverview = `<table>
								<tr>
									<td> title </td>
								`;
	for (const prop of properties) {
		tableOverview += `<td> ${prop} </td>`;
	}
	tableOverview += "</tr>";
	for (const note of notes) {
		tableOverview += `
				<tr>
					<td> <a href=":/${note.id}">${note.title}</a> </td>
				`;
		for (const prop of properties) {
			let propValue = "";
			if (note.frontmatter.hasOwnProperty(prop)) {
				propValue = note.frontmatter[prop];
			}
			tableOverview += `<td> ${propValue} </td>`;
		}
		tableOverview += "</tr>";
	}
	tableOverview += "</table>";
	return tableOverview;
}

async function renderOverview() {
	const overviews = document.getElementsByClassName('frontmatter-overview');

    for (let i=0; i<overviews.length; i++){
        const overview = overviews[i];

		let overviewSettings = null;
		try {
			overviewSettings = yaml.load(overview.textContent) as overviewSettings;
		}
		catch (error) {
			console.log("yaml parsing error:", error);
			renderContent(`YAML parsing error: ${error.message}`, overview);
			continue;
		}

		if (!settingsValid(overviewSettings)) {
			renderContent("Invalid overview settings", overview);
			continue;
		}

		// get notes
		let notes = await webviewApi.postMessage('frontmatter-overview', overviewSettings.from);
		notes = getFrontmatter(notes);

 		let tableOverview = makeTableOverview(overviewSettings.properties, notes);

		renderContent(tableOverview, overview);
	}
}