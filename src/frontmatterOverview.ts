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

				return renderContent("Frontmatter Overview");
			};
		},
	}
}