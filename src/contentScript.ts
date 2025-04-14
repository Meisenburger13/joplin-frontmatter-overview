module.exports = {
	default: function (context) {
		return {
			plugin: function (markdownIt, _options) {
				const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
					return self.renderToken(tokens, idx, options, env, self);
				};

				markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
					const token = tokens[idx];
					if (token.info !== "frontmatter-overview") return defaultRender(tokens, idx, options, env, self);
					const postMessageWithResponseTest =`
                        webviewApi.postMessage("${context.contentScriptId}", "${encodeURI(token.content)}")
							.then(function(response) {
								document.getElementById("frontmatter-overview-${idx}").innerHTML=response;
							});
						`;
					const richTextEditorMetadata = `
 						<pre
 							class="joplin-source"
 							data-joplin-language="button-counter"
 							data-joplin-source-open="\`\`\`button-counter\n"
 							data-joplin-source-close="\`\`\`"
 						>${markdownIt.utils.escapeHtml(token.content)}</pre>
 					`;

					return `<div class="joplin-editable">
								${richTextEditorMetadata}
								<div id="frontmatter-overview-${idx}">Loading frontmatter overview...</div>
							</div>
							<style onload='${postMessageWithResponseTest.replace(/\n/g, ' ')}'></style>
					`;
				};
			}
		}
	}
}