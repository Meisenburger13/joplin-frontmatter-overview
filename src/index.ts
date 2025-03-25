import joplin from 'api';
import {ContentScriptType} from 'api/types';

joplin.plugins.register({
	onStart: async function() {
		console.log("frontmatter overview started!")
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'frontmatter-overview',
			'./contentScript.js'
		);
	},
});