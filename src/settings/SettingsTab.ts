import {
	App,
	ButtonComponent,
	Notice,
	PluginSettingTab,
	Setting,
	TextAreaComponent,
	TextComponent,
} from "obsidian";
import ChatStreamPlugin from "./../AugmentedCanvasPlugin";
import { SystemPrompt, getModels } from "./AugmentedCanvasSettings";

export class SettingsTab extends PluginSettingTab {
	plugin: ChatStreamPlugin;

	constructor(app: App, plugin: ChatStreamPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Model")
			.setDesc("Select the GPT model to use.")
			.addDropdown((cb) => {
				getModels().forEach((model) => {
					cb.addOption(model, model);
				});
				cb.setValue(this.plugin.settings.apiModel);
				cb.onChange(async (value) => {
					this.plugin.settings.apiModel = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("API key")
			.setDesc(
				"The API key to use when making requests - Get from OpenAI"
			)
			.addText((text) => {
				text.inputEl.type = "password";
				text.setPlaceholder("API Key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Default system prompt")
			.setDesc(
				`The system prompt sent with each request to the API. \n(Note: you can override this by beginning a note stream with a note starting 'SYSTEM PROMPT'. The remaining content of that note will be used as system prompt.)`
			)
			.addTextArea((component) => {
				component.inputEl.rows = 6;
				component.inputEl.style.width = "300px";
				component.inputEl.style.fontSize = "10px";
				component.setValue(this.plugin.settings.systemPrompt);
				component.onChange(async (value) => {
					this.plugin.settings.systemPrompt = value;
					await this.plugin.saveSettings();
				});
			});

		this.displaySystemPromptsSettings(containerEl);

		new Setting(containerEl)
			.setName("Max input tokens")
			.setDesc(
				"The maximum number of tokens to send (within model limit). 0 means as many as possible"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.maxInputTokens.toString())
					.onChange(async (value) => {
						const parsed = parseInt(value);
						if (!isNaN(parsed)) {
							this.plugin.settings.maxInputTokens = parsed;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Max response tokens")
			.setDesc(
				"The maximum number of tokens to return from the API. 0 means no limit. (A token is about 4 characters)."
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.maxResponseTokens.toString())
					.onChange(async (value) => {
						const parsed = parseInt(value);
						if (!isNaN(parsed)) {
							this.plugin.settings.maxResponseTokens = parsed;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Max depth")
			.setDesc(
				"The maximum depth of ancestor notes to include. 0 means no limit."
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.maxDepth.toString())
					.onChange(async (value) => {
						const parsed = parseInt(value);
						if (!isNaN(parsed)) {
							this.plugin.settings.maxDepth = parsed;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Temperature")
			.setDesc("Sampling temperature (0-2). 0 means no randomness.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.temperature.toString())
					.onChange(async (value) => {
						const parsed = parseFloat(value);
						if (!isNaN(parsed) && parsed >= 0 && parsed <= 2) {
							this.plugin.settings.temperature = parsed;
							await this.plugin.saveSettings();
						}
					})
			);

		// new Setting(containerEl)
		// 	.setName("API URL")
		// 	.setDesc(
		// 		"The chat completions URL to use. You probably won't need to change this."
		// 	)
		// 	.addText((text) => {
		// 		text.inputEl.style.width = "300px";
		// 		text.setPlaceholder("API URL")
		// 			.setValue(this.plugin.settings.apiUrl)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.apiUrl = value;
		// 				await this.plugin.saveSettings();
		// 			});
		// 	});

		new Setting(containerEl)
			.setName("Debug output")
			.setDesc("Enable debug output in the console")
			.addToggle((component) => {
				component
					.setValue(this.plugin.settings.debug)
					.onChange(async (value) => {
						this.plugin.settings.debug = value;
						await this.plugin.saveSettings();
					});
			});
	}

	displaySystemPromptsSettings(containerEl: HTMLElement): void {
		const setting = new Setting(containerEl);

		setting
			.setName("Add system prompts")
			.setClass("augmented-canvas-setting-item")
			.setDesc(
				`Create new highlight colors by providing a color name and using the color picker to set the hex code value. Don't forget to save the color before exiting the color picker. Drag and drop the highlight color to change the order for your highlighter component.`
			);

		const nameInput = new TextComponent(setting.controlEl);
		nameInput.setPlaceholder("Name");
		// colorInput.inputEl.addClass("highlighter-settings-color");

		let promptInput: TextAreaComponent;
		setting.addTextArea((component) => {
			component.inputEl.rows = 6;
			component.inputEl.style.width = "300px";
			component.inputEl.style.fontSize = "10px";
			component.setPlaceholder("Prompt");
			component.inputEl.addClass("augmented-canvas-settings-prompt");
			promptInput = component;
		});

		setting.addButton((button) => {
			button
				.setIcon("lucide-,plus")
				.setTooltip("Add")
				.onClick(async (buttonEl: any) => {
					let name = nameInput.inputEl.value;
					const prompt = promptInput.inputEl.value;

					// console.log({ name, prompt });

					if (!name || !prompt) {
						name && !prompt
							? new Notice("Prompt missing")
							: !name && prompt
							? new Notice("Name missing")
							: new Notice("Values missing"); // else
						return;
					}

					// * Handles multiple with the same name
					// if (
					// 	this.plugin.settings.systemPrompts.filter(
					// 		(systemPrompt: SystemPrompt) =>
					// 			systemPrompt.act === name
					// 	).length
					// ) {
					// 	name += " 2";
					// }
					// let count = 3;
					// while (
					// 	this.plugin.settings.systemPrompts.filter(
					// 		(systemPrompt: SystemPrompt) =>
					// 			systemPrompt.act === name
					// 	).length
					// ) {
					// 	name = name.slice(0, -2) + " " + count;
					// 	count++;
					// }

					if (
						!this.plugin.settings.systemPrompts.filter(
							(systemPrompt: SystemPrompt) =>
								systemPrompt.act === name
						).length &&
						!this.plugin.settings.userSystemPrompts.filter(
							(systemPrompt: SystemPrompt) =>
								systemPrompt.act === name
						).length
					) {
						this.plugin.settings.userSystemPrompts.push({
							id:
								this.plugin.settings.systemPrompts.length +
								this.plugin.settings.userSystemPrompts.length,
							act: name,
							prompt,
						});
						await this.plugin.saveSettings();
						this.display();
					} else {
						buttonEl.stopImmediatePropagation();
						new Notice("This system prompt name already exists");
					}
				});
		});

		const listContainer = containerEl.createEl("div", {
			cls: "augmented-canvas-list-container",
		});

		this.plugin.settings.userSystemPrompts.forEach(
			(systemPrompt: SystemPrompt) => {
				const listElement = listContainer.createEl("div", {
					cls: "augmented-canvas-list-element",
				});

				const nameInput = new TextComponent(listElement);
				nameInput.setValue(systemPrompt.act);

				const promptInput = new TextAreaComponent(listElement);
				promptInput.inputEl.addClass(
					"augmented-canvas-settings-prompt"
				);
				promptInput.setValue(systemPrompt.prompt);

				const buttonSave = new ButtonComponent(listElement);
				buttonSave
					.setIcon("lucide-save")
					.setTooltip("Save")
					.onClick(async (buttonEl: any) => {
						let name = nameInput.inputEl.value;
						const prompt = promptInput.inputEl.value;

						// console.log({ name, prompt });
						this.plugin.settings.userSystemPrompts =
							this.plugin.settings.userSystemPrompts.map(
								(systemPrompt2: SystemPrompt) =>
									systemPrompt2.id === systemPrompt.id
										? {
												...systemPrompt2,
												act: name,
												prompt,
										  }
										: systemPrompt2
							);
						await this.plugin.saveSettings();
						this.display();
						new Notice("System prompt updated");
					});

				const buttonDelete = new ButtonComponent(listElement);
				buttonDelete
					.setIcon("lucide-trash")
					.setTooltip("Delete")
					.onClick(async (buttonEl: any) => {
						let name = nameInput.inputEl.value;
						const prompt = promptInput.inputEl.value;

						// console.log({ name, prompt });
						this.plugin.settings.userSystemPrompts =
							this.plugin.settings.userSystemPrompts.filter(
								(systemPrompt2: SystemPrompt) =>
									systemPrompt2.id !== systemPrompt.id
							);
						await this.plugin.saveSettings();
						this.display();
						new Notice("System prompt deleted");
					});
			}
		);
	}
}

export default SettingsTab;
