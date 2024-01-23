import { Modal, App } from "obsidian";

export class CustomQuestionModal extends Modal {
	onSubmit: (input: string) => void;

	constructor(app: App, onSubmit: (input: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.className = "augmented-canvas-modal-container";

		let textareaEl = contentEl.createEl("textarea");
		textareaEl.className = "augmented-canvas-modal-input";

		// Create and append a submit button
		let submitBtn = contentEl.createEl("button", { text: "Ask AI" });
		submitBtn.onClickEvent(() => {
			this.onSubmit(textareaEl.value);
			this.close();
		});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
