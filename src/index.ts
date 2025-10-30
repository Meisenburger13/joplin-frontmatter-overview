import joplin from "api";
import { ContentScriptType, SettingItemType } from "api/types";
import * as yaml from "js-yaml";
import TurndownService from "turndown";
import { tables } from "turndown-plugin-gfm";
// Can't use import for this library because the types in the library
// are declared incorrectly which result in typescript errors.
// Reference -> https://github.com/jxson/front-matter/issues/76
// eslint-disable-next-line @typescript-eslint/no-var-requires
const frontmatter = require("front-matter");

const LINE_NUM = "LINE_NUM";
const NOTE_LINK = "NOTE_LINK";

const isMobilePlatform = async () => {
	try {
		const version = await joplin.versionInfo() as any;
		return version?.platform === 'mobile';
	} catch(error) {
		console.warn('Error checking whether the device is a mobile device. Assuming desktop.', error);
		return false;
	}
};


interface PropertyNames {
	original: string,
	alias: string
}

interface overviewSettings {
	from: string;
	properties: string[] | PropertyNames[];
	sort?: string;
	reverseSort: boolean;
	excludeEmpty?: boolean;
}

function settingsValid(settings): settings is overviewSettings {
    return (
        typeof settings === "object" &&
        settings !== null &&
        typeof settings.from === "string" &&
        Array.isArray(settings.properties) &&
        settings.properties.every((item) => typeof item === "string") &&
		(settings.sort === undefined || typeof settings.sort === "string") &&
		(settings.excludeEmpty === undefined || typeof settings.excludeEmpty === "boolean")
    );
}

function sortValid(overviewSettings) {
	return (overviewSettings.sort === undefined ||
		overviewSettings.properties.some( ({original}) => original === overviewSettings.sort))
	&& overviewSettings.sort !== LINE_NUM
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
		const match = prop.match(/^(.+?)\s+AS\s+(.+)$/);
		return match
			? { original: match[1].trim(), alias: match[2].trim() }
			: { original: prop, alias: prop };
	});

	if (overviewSettings.sort && overviewSettings.sort.endsWith(" DESC")) {
		overviewSettings.reverseSort = true;
		overviewSettings.sort = overviewSettings.sort.slice(0, -5);
	}
	// check sort
	if (!sortValid(overviewSettings)) {
		return `Invalid sort parameter: Please check that it matches one of the original property names, except ${LINE_NUM}.`
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
		notes.push(...response.items);
		pageNum++;
	} while (response.hasMore)

	// exclude selected note from search
	const selectedNoteId = (await joplin.workspace.selectedNote()).id
	notes = notes.filter((note) => note.id !== selectedNoteId);

	return notes;
}

function getFrontmatter(notes) {
	for (const note of notes) {
		let parsedFrontmatter;
		const wrapLinksInFm = note.body.replace(
			/: (.*\[.*]\(.*\).*)/g,
			(_match, p1) => {
				const escaped = p1.replace(/"/g, '\\"'); // Escape existing double quotes
				return `: "${escaped}"`;                 // Wrap in quotes
			}
		);
		try {
			parsedFrontmatter = frontmatter(wrapLinksInFm);
		}
		catch (error){
			console.error(`Error in frontmatter in note: ${note.title}`, error);
			note.frontmatter = {};
			continue;
		}
		note.frontmatter = parsedFrontmatter.attributes;
	}
	return notes;
}

function sortNotes(a, b, sort) {
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

async function makeImages(notes, width, height) {
	for (const note of notes) {
		for (let [key, value] of Object.entries(note.frontmatter)) {
			if (typeof value !== "string") { continue; }

			let strValue = value as string;
			// Replace images with HTML
			const images = strValue.matchAll(/!\[(.*?)]\(:\/([a-z0-9]{32})\)/g);
			for (const [mdImage, alt, id] of images) {
				const path = await joplin.data.resourcePath(id);
				const imageDiv = document.createElement("div");
				imageDiv.textContent = alt;
				const isMobile = await isMobilePlatform();
				let src:  string;
				if (isMobile) {
					src = `file:///`;
				}
				else {
					src = `joplin-content://note-viewer/`;
				}
				strValue = strValue.replace(mdImage, `<img data-resource-id="${id}" src="${src}${path}" style="max-width: ${width}; max-height: ${height}" alt="${alt}">`);
				note.frontmatter[key] = strValue;
			}
		}
	}
	return notes;
}

function makeLinks(notes) {
	for (const note of notes) {
		for (let [key, value] of Object.entries(note.frontmatter)) {
			if (typeof value === "string") {
				let strValue = value as string;
				// Replace Markdown links with HTML links
				const links = strValue.matchAll(/\[(.*?)]\((.*?)\)/g);
				for (const [mdLink, title, url] of links) {
					const titleDiv = document.createElement("div");
					titleDiv.textContent = title;
					strValue = strValue.replace(mdLink, `<a href="${url}">${titleDiv.innerHTML}</a>`);
					note.frontmatter[key] = strValue;
				}
			}
		}
	}
	return notes;
}

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

async function renderOverview(overview:string) {
	const pluginSettings = await joplin.settings.values(["width", "height"]);
	const overviewSettings = getOverviewSettings(overview);
	if (typeof overviewSettings === "string") { return overviewSettings; }
	// get notes
	let notes = await getNotes(overviewSettings.from);
	notes = getFrontmatter(notes);
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

async function makeTablesPermanent() {
	const selectedNote = await joplin.workspace.selectedNote();
	if (!selectedNote) { return; }

	let body:string = selectedNote.body;
	const overviews = body.matchAll(/```frontmatter-overview\n([\s\S]*?)```/g);

	const turndownService = new TurndownService();
	turndownService.use(tables);
	turndownService.addRule("imageToMarkdown", {
		filter: "img",
		replacement: function (_, node) {
			const alt = node.getAttribute("alt");
			const id = node.getAttribute("data-resource-id");
			return `![${alt}](:/${id})`;
		}
	});

	// turn HTML tables to MD
	for (const overview of overviews) {
		const tableHTML = await renderOverview(overview[1]);
		const markdownTable = turndownService.turndown(tableHTML);
		body = body.replace(overview[0], markdownTable + "\n");
		await joplin.data.put(["notes", selectedNote.id], null, { body: body });
	}
}


joplin.plugins.register({
	onStart: async function() {
		console.log("frontmatter overview started!")

		await joplin.settings.registerSection("Frontmatter Overview", {
			label: "Frontmatter Overview",
			iconName: "fas fa-table",
		});

		await joplin.settings.registerSettings({
			"width": {
				value: "auto",
				type: SettingItemType.String,
				isEnum: true,
				options: {
					"auto": "auto",
					"5vw": "5%",
					"10vw": "10%",
					"20vw": "20%",
					"30vw": "30%",
					"40vw": "40%",
					"50vw": "50%",
					"60vw": "60%",
					"70vw": "70%",
					"80vw": "80%",
					"90vw": "90%",
					"100vw": "100%"
				},
				section: "Frontmatter Overview",
				public: true,
				label: "Set the maximum width of all images in the dynamic overviews",
				description: "Relative to the window size."
			},
			"height": {
				value: "auto",
				type: SettingItemType.String,
				isEnum: true,
				options: {
					"auto": "auto",
					"5vh": "5%",
					"10vh": "10%",
					"20vh": "20%",
					"30vh": "30%",
					"40vh": "40%",
					"50vh": "50%",
					"60vh": "60%",
					"70vh": "70%",
					"80vh": "80%",
					"90vh": "90%",
					"100vh": "100%"
				},
				section: "Frontmatter Overview",
				public: true,
				label: "Set the maximum height of all images in the dynamic overviews",
				description: "Relative to the window size."
			}
		});

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			"frontmatter-overview",
			"./contentScript.js"
		);

		await joplin.commands.register({
			name: "makeTablesPermanent",
			label: "Make tables in current note permanent",
			execute: async () => {
				await makeTablesPermanent();
			}
		});

		await joplin.views.menus.create("frontmatter-overview-menu", "Frontmatter overview", [
			{ label: "Make tables in current note permanent", commandName: "makeTablesPermanent" }
		]);

		await joplin.contentScripts.onMessage("frontmatter-overview", async (overviewString) => {
			const overview = decodeURI(overviewString);
			return await renderOverview(overview);
		});
	},
});