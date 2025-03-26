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
								console.info("Got response from content script: ");
								document.getElementById("frontmatter-overview-${idx}").innerHTML=response;
							});
						`;

					return `<div class="joplin-editable">
								<div id="frontmatter-overview-${idx}"></div>
							</div>
							<style onload='${postMessageWithResponseTest.replace(/\n/g, ' ')}'></style>
					`;
				};
			}
		}
	}
}