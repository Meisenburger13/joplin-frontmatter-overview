import * as yaml from 'js-yaml';

document.addEventListener('joplin-noteDidUpdate', renderOverview);


function renderContent(content, overview) {
	overview.innerHTML = content;
}

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

function renderOverview() {
	const overviews = document.getElementsByClassName('frontmatter-overview');

    for (let i=0; i<overviews.length; i++){
        const overview = overviews[i];

		let overviewSettings = null;
		try {
			overviewSettings = yaml.load(overview.textContent) as overviewSettings;
		}
		catch (error) {
			console.log("yaml parsing error:", error);
			renderContent(`YAML parsing error: ${error.message}`, overview);
			continue;
		}

		if (!settingsValid(overviewSettings)) {
			renderContent("Invalid overview settings", overview);
			continue;
		}
		renderContent("async: " + yaml.dump(overviewSettings), overview);
	}
}