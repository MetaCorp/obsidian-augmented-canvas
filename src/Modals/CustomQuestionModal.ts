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
		textareaEl.placeholder = "Write your question here";

		// Add keydown event listener to the textarea
		textareaEl.addEventListener("keydown", (event) => {
			// Check if Ctrl + Enter is pressed
			if (event.ctrlKey && event.key === "Enter") {
				// Prevent default action to avoid any unwanted behavior
				event.preventDefault();
				// Call the onSubmit function and close the modal
				this.onSubmit(textareaEl.value);
				this.close();
			}
		});

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
