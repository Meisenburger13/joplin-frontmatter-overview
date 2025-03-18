import * as yaml from "yaml";

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

export default function() {
	return {
		plugin: function(markdownIt, _options) {
			const defaultRender = markdownIt.renderer.rules.fence || function(tokens, idx, options, env, self) {
				return self.renderToken(tokens, idx, options, env, self);
			};

			markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
				const token = tokens[idx];
				if (token.info !== 'frontmatter-overview') return defaultRender(tokens, idx, options, env, self);

				function renderContent(message) {
					// Rich text editor support:
					// The joplin-editable and joplin-source CSS classes mark the generated div
					// as a region that needs special processing when converting back to markdown.
					// This element helps Joplin reconstruct the original markdown.
					const richTextEditorMetadata = `
						<pre
							class="joplin-source"
							data-joplin-language="frontmatter-overview"
							data-joplin-source-open="\`\`\`frontmatter-overview\n"
							data-joplin-source-close="\`\`\`"
						>${markdownIt.utils.escapeHtml(token.content)}</pre>
					`;

					return `<div class="frontmatter-overview joplin-editable">
								${richTextEditorMetadata}
				
								<p>${message}</p>
							</div>
						`;
				}

				let overviewSettings = null;
				try {
					overviewSettings = yaml.parse(token.content);
				} catch (error) {
					return renderContent(`YAML parsing error: ${error.message}`);
				}

				if (!settingsValid(overviewSettings)) {
					return renderContent("Invalid overview settings");
				}

				return renderContent(yaml.stringify(overviewSettings));
			};
		},
	}
}