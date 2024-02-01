import { App, FuzzySuggestModal, TFile, TFolder } from "obsidian";

export default class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	onChoose: (systemPrompt: TFolder) => void;

	constructor(app: App, onChoose: (folder: TFolder) => void) {
		super(app);
		this.onChoose = onChoose;
	}

	getItems(): TFolder[] {
		// Get all markdown files and then map to their parent folders, removing duplicates.
		return this.app.vault
			.getAllLoadedFiles()
			.filter((file) => file instanceof TFolder) as TFolder[];
	}

	getItemText(folder: TFolder): string {
		// Return a string for the display of each item in the list.
		return folder.path;
	}

	onChooseItem(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
		this.onChoose(folder);
	}
}
