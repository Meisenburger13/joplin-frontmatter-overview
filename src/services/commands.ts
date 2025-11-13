import joplin from "api";
import TurndownService from "turndown";
import { tables } from "turndown-plugin-gfm";
import { renderOverview } from "../services";


export async function makeTablesPermanent() {
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