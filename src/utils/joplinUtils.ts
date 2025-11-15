import joplin from "api";

export async function isMobilePlatform(){
	try {
		const version = await joplin.versionInfo() as any;
		return version?.platform === 'mobile';
	} catch(error) {
		console.warn('Error checking whether the device is a mobile device. Assuming desktop.', error);
		return false;
	}
}

export async function getNotes(query: string) {
	let notes = [];
	let pageNum = 1;
	let response: { items: any; has_more: boolean; };
	do {
		response = await joplin.data.get(["search"], {
			query: query,
			type: "note",
			page: pageNum,
			fields: "id,title,body"
		});
		notes.push(...response.items);
		pageNum++;
	} while (response.has_more)

	// exclude selected note from search
	const selectedNoteId = (await joplin.workspace.selectedNote()).id
	notes = notes.filter((note) => note.id !== selectedNoteId);

	return notes;
}