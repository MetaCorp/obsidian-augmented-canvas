import { Plugin, Modal, App, Notice, Setting, Command } from "obsidian";

export class InputModal extends Modal {
	label: string;
	buttonLabel: string;
	onSubmit: (value: string) => void;
	inputEl: HTMLInputElement;

	constructor(
		app: App,
		{ label, buttonLabel }: { label: string; buttonLabel: string },
		onSubmit: (value: string) => void
	) {
		super(app);
		this.label = label;
		this.buttonLabel = buttonLabel;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.className = "augmented-canvas-modal-container";

		let inputEl = contentEl.createEl("input");
		inputEl.className = "augmented-canvas-modal-input";
		inputEl.placeholder = this.label;

		// Add keydown event listener to the textarea
		inputEl.addEventListener("keydown", (event) => {
			// Check if Ctrl + Enter is pressed
			if (event.key === "Enter") {
				// Prevent default action to avoid any unwanted behavior
				event.preventDefault();
				// Call the onSubmit function and close the modal
				this.onSubmit(inputEl.value);
				this.close();
			}
		});

		// Create and append a submit button
		let submitBtn = contentEl.createEl("button", {
			text: this.buttonLabel,
		});
		submitBtn.onClickEvent(() => {
			this.onSubmit(inputEl.value);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	submit() {
		const value = this.inputEl.value;
		this.onSubmit(value);
		this.close();
	}
}
