import joplin from "api";
import TurndownService from "turndown";
import { tables } from "@joplin/turndown-plugin-gfm";
import { renderOverview } from "../services";

function imagesToMarkdownPlugin(service: TurndownService) {
	service.addRule("imageToMarkdown", {
		filter: "img",
		replacement: function (_, node: HTMLElement) {
			const alt = node.getAttribute("alt");
			const id = node.getAttribute("data-resource-id");
			return `![${alt}](:/${id})`;
		}
	});
}

const turndownService = (() => {
	const service = new TurndownService();
	service.use(tables);
	service.use(imagesToMarkdownPlugin);
	return service;
})();

export async function turndownTables() {
	const selectedNote = await joplin.workspace.selectedNote();
	if (!selectedNote) { return; }

	let body:string = selectedNote.body;
	const overviews = body.matchAll(/```frontmatter-overview\n([\s\S]*?)```/g);

	// turn HTML tables to MD
	for (const [frontmatterOverview, frontmatterSettings] of overviews) {
		const htmlTable = await renderOverview(frontmatterSettings);
		const markdownTable = turndownService.turndown(htmlTable);
		body = body.replace(frontmatterOverview, markdownTable + "\n");
	}

	// update body
	await joplin.data.put(["notes", selectedNote.id], null, { body: body });
}