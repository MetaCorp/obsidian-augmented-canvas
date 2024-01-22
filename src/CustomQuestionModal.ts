import { Modal, App } from "obsidian";

export class CustomQuestionModal extends Modal {
	onSubmit: (input: string) => void;

	constructor(app: App, onSubmit: (input: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.style.display = "flex";
		contentEl.style.gap = "16px";
		contentEl.style.justifyContent = "flex-end";
		contentEl.style.alignItems = "flex-end";

		let textareaEl = contentEl.createEl("textarea");
		textareaEl.style.boxSizing = "border-box"; // Include padding and borders in the width
		textareaEl.style.minHeight = "70px"; // Set a minimum height
		textareaEl.style.flexGrow = "1";

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
