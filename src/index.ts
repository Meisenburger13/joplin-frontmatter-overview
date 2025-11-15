import joplin from "api";
import { ContentScriptType, SettingItemType } from "api/types";
import { turndownTables, renderOverview } from "./services";

joplin.plugins.register({
	onStart: async function() {
		console.log("frontmatter overview started!")

		await joplin.contentScripts.onMessage("frontmatter-overview", async (overviewString) => {
			const overview = decodeURI(overviewString);
			return await renderOverview(overview);
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
				await turndownTables();
			}
		});

		await joplin.views.menus.create("frontmatter-overview-menu", "Frontmatter overview", [
			{ label: "Make tables in current note permanent", commandName: "makeTablesPermanent" }
		]);

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
	},
});