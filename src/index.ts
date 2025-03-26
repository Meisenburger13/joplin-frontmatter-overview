import joplin from "api";
import {ContentScriptType} from "api/types";

joplin.plugins.register({
	onStart: async function() {
		console.log("frontmatter overview started!")
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			"frontmatter-overview",
			"./contentScript.js"
		);

		await joplin.contentScripts.onMessage("frontmatter-overview", async (searchTerm) => {
			let notes = [];
			let pageNum = 1;
			let response;
			do {
				response = await joplin.data.get(["search"], {
					query: searchTerm,
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
		});
	},
});