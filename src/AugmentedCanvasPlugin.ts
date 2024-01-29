import {
	Canvas,
	CanvasView,
	ItemView,
	Menu,
	MenuItem,
	Notice,
	Plugin,
	setIcon,
	setTooltip,
} from "obsidian";
import { around } from "monkey-around";
import { handleCallGPT, handleCallGPT_Question } from "./advancedCanvas";
import {
	AugmentedCanvasSettings,
	DEFAULT_SETTINGS,
	SystemPrompt,
} from "./settings/AugmentedCanvasSettings";
import SettingsTab from "./settings/SettingsTab";
import { CustomQuestionModal } from "./CustomQuestionModal";
import { CanvasNode } from "./obsidian/canvas-internal";
import { handlePatchNoteMenu } from "./noteMenuPatch";
import { createCanvasGroup, getActiveCanvas } from "./utils";
import SystemPromptsModal from "./SystemPromptsModal";

import { createFlashcards } from "./flashcards";
import { getFilesContent } from "./obsidian/fileUtil";
import { getResponse } from "./chatgpt";
import { parseCsv } from "./csvUtils";

export default class AugmentedCanvasPlugin extends Plugin {
	triggerByPlugin: boolean = false;
	patchSucceed: boolean = false;

	settings: AugmentedCanvasSettings;

	async onload() {
		this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		// this.registerCommands();
		// this.registerCanvasEvents();
		// this.registerCustomIcons();

		// this.patchCanvas();
		setTimeout(() => {
			this.patchCanvasMenu();
			this.addCommands();
			this.patchNoteContextMenu();

			if (this.settings.systemPrompts.length === 0) {
				this.fetchSystemPrompts();
			}
		}, 100);
		// this.patchCanvasInteraction();
		// this.patchCanvasNode();

		// const generator = noteGenerator(this.app, this.settings, this.logDebug)
		// const generator = noteGenerator(this.app);

		// this.addSettingTab(new SettingsTab(this.app, this))

		// this.addCommand({
		// 	id: "next-note",
		// 	name: "Create next note",
		// 	callback: () => {
		// 		generator.nextNote();
		// 	},
		// 	hotkeys: [
		// 		{
		// 			modifiers: ["Alt", "Shift"],
		// 			key: "N",
		// 		},
		// 	],
		// });

		// this.addCommand({
		// 	id: "generate-note",
		// 	name: "Generate AI note",
		// 	callback: () => {
		// 		generator.generateNote();
		// 	},
		// 	hotkeys: [
		// 		{
		// 			modifiers: ["Alt", "Shift"],
		// 			key: "G",
		// 		},
		// 	],
		// });
	}

	onunload() {
		// refreshAllCanvasView(this.app);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	patchCanvasMenu() {
		const app = this.app;
		const settings = this.settings;

		const patchMenu = () => {
			const canvasView = this.app.workspace
				.getLeavesOfType("canvas")
				.first()?.view;
			if (!canvasView) return false;

			const menu = (canvasView as CanvasView)?.canvas.menu;
			if (!menu) return false;

			const selection = menu.selection;
			if (!selection) return false;

			const menuUninstaller = around(menu.constructor.prototype, {
				render: (next: any) =>
					function (...args: any) {
						const result = next.call(this, ...args);

						// * If multi selection
						const maybeCanvasView =
							app.workspace.getActiveViewOfType(
								ItemView
							) as CanvasView | null;
						if (
							!maybeCanvasView ||
							maybeCanvasView.canvas?.selection?.size !== 1
						)
							return result;

						const selectedNode = Array.from(
							maybeCanvasView.canvas?.selection
						)[0];
						if (
							// @ts-expect-error
							selectedNode.from
						)
							return result;

						if (this.menuEl.querySelector(".gpt-menu-item"))
							return result;

						// * Handles "Call GPT" button

						const buttonEl_AskAI = createEl(
							"button",
							"clickable-icon gpt-menu-item"
						);
						setTooltip(buttonEl_AskAI, "Ask AI", {
							placement: "top",
						});
						setIcon(buttonEl_AskAI, "lucide-sparkles");
						this.menuEl.appendChild(buttonEl_AskAI);

						buttonEl_AskAI.addEventListener("click", () => {
							handleCallGPT(
								app,
								settings,
								<CanvasNode>(
									Array.from(this.canvas.selection)?.first()
								)
							);
						});

						// const node = <CanvasNode>(
						// 	Array.from(this.canvas.selection)?.first()
						// );

						// if (!node?.unknownData.questions?.length) return;

						// * Handles "Ask Question" button

						const buttonEl_AskQuestion = createEl(
							"button",
							"clickable-icon gpt-menu-item"
						);
						setTooltip(
							buttonEl_AskQuestion,
							"Ask question with AI",
							{
								placement: "top",
							}
						);
						setIcon(buttonEl_AskQuestion, "lucide-help-circle");
						this.menuEl.appendChild(buttonEl_AskQuestion);
						buttonEl_AskQuestion.addEventListener("click", () => {
							let modal = new CustomQuestionModal(
								app,
								(question2: string) => {
									handleCallGPT_Question(
										app,
										settings,
										<CanvasNode>(
											Array.from(
												this.canvas.selection
											)?.first()!
										),
										question2
									);
									// Handle the input
								}
							);
							modal.open();
						});

						// * Handles "AI Questions" button

						const buttonEl_AIQuestions = createEl(
							"button",
							"clickable-icon gpt-menu-item"
						);
						setTooltip(
							buttonEl_AIQuestions,
							"AI generated questions",
							{
								placement: "top",
							}
						);
						setIcon(buttonEl_AIQuestions, "lucide-file-question");
						this.menuEl.appendChild(buttonEl_AIQuestions);
						buttonEl_AIQuestions.addEventListener("click", () =>
							handlePatchNoteMenu(
								buttonEl_AIQuestions,
								this.menuEl,
								{
									app,
									settings,
									canvas: this.canvas,
								}
							)
						);

						return result;
					},
			});

			this.register(menuUninstaller);
			this.app.workspace.trigger("collapse-node:patched-canvas");

			return true;
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchMenu()) {
				const evt = this.app.workspace.on("layout-change", () => {
					patchMenu() && this.app.workspace.offref(evt);
				});
				this.registerEvent(evt);
			}
		});
	}

	async fetchSystemPrompts() {
		const response = await fetch(
			"https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv"
		);
		const text = await response.text();
		const parsedCsv = parseCsv(text);
		console.log({ parsedCsv });

		const systemPrompts: SystemPrompt[] = parsedCsv
			.slice(1)
			.map((value: string[], index: number) => ({
				id: index,
				act: value[0],
				prompt: value[1],
			}));
		console.log({ systemPrompts });

		this.settings.systemPrompts = systemPrompts;

		this.saveSettings();
	}

	patchNoteContextMenu() {
		const settings = this.settings;
		// * no event name to add to Canvas context menu ("canvas-menu" does not exist)
		this.app.workspace.on("canvas:node-menu", (menu) => {
			menu.addSeparator();
			menu.addItem((item) => {
				item.setTitle("Create flashcards")
					.setIcon("lucide-wallet-cards")
					.onClick(() => {
						createFlashcards(this.app, settings);
					});
			});
		});
	}

	addCommands() {
		const app = this.app;

		this.addCommand({
			id: "insert-system-prompt",
			name: "Insert system prompt",
			checkCallback: (checking: boolean) => {
				if (checking) {
					// console.log({ checkCallback: checking });
					if (!getActiveCanvas(app)) return false;

					return true;
				}

				new SystemPromptsModal(app, this.settings).open();
			},
			// callback: () => {},
		});

		const RELEVANT_QUESTION_SYSTEM_PROMPT = `
There must be 6 questions.

You must respond in this JSON format: {
	"questions": The questions
}

You must respond in the language the user used.
`.trim();

		const handleAddRelevantQuestions = async () => {
			new Notice("Generating relevant questions...");

			const files = await app.vault.getMarkdownFiles();

			const sortedFiles = files.sort(
				(a, b) => b.stat.mtime - a.stat.mtime
			);

			const actualFiles = sortedFiles.slice(
				0,
				this.settings.insertRelevantQuestionsFilesCount
			);

			const filesContent = await getFilesContent(app, actualFiles);

			const gptResponse = await getResponse(
				this.settings.apiKey,
				[
					{
						role: "system",
						content: `
${this.settings.relevantQuestionsSystemPrompt}
${RELEVANT_QUESTION_SYSTEM_PROMPT}
`,
					},
					{
						role: "user",
						content: filesContent,
					},
				],
				{ isJSON: true }
			);
			// console.log({ gptResponse });

			await createCanvasGroup(app, "Questions", gptResponse.questions);

			new Notice("Generating relevant questions done successfully.");
		};

		this.addCommand({
			id: "insert-relevant-questions",
			name: "Insert relevant questions",
			checkCallback: (checking: boolean) => {
				if (checking) {
					// console.log({ checkCallback: checking });
					if (!getActiveCanvas(app)) return false;

					return true;
				}

				// new SystemPromptsModal(this.app, this.settings).open();
				handleAddRelevantQuestions();
			},
			// callback: async () => {},
		});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
