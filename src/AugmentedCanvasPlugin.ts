import {
	Canvas,
	CanvasView,
	ItemView,
	Menu,
	MenuItem,
	Notice,
	Plugin,
	TFolder,
	setIcon,
	setTooltip,
} from "obsidian";
import { around } from "monkey-around";
import {
	addAskAIButton,
	addRegenerateResponse,
	handleCallGPT_Question,
} from "./actions/canvasNodeMenuActions/advancedCanvas";
import {
	AugmentedCanvasSettings,
	DEFAULT_SETTINGS,
	SystemPrompt,
} from "./settings/AugmentedCanvasSettings";
import SettingsTab from "./settings/SettingsTab";
import { CustomQuestionModal } from "./modals/CustomQuestionModal";
import { CanvasNode } from "./obsidian/canvas-internal";
import { handlePatchNoteMenu } from "./actions/menuPatches/noteMenuPatch";
import { createCanvasGroup, getActiveCanvas } from "./utils";
import SystemPromptsModal from "./modals/SystemPromptsModal";

import { createFlashcards } from "./actions/canvasNodeContextMenuActions/flashcards";
import { getFilesContent } from "./obsidian/fileUtil";
import { getResponse } from "./utils/chatgpt";
import { parseCsv } from "./utils/csvUtils";
import { handleAddRelevantQuestions } from "./actions/commands/relevantQuestions";
import { handleGenerateImage } from "./actions/canvasNodeContextMenuActions/generateImage";
import { initLogDebug } from "./logDebug";
import FolderSuggestModal from "./modals/FolderSuggestModal";
import { calcHeight, createNode } from "./obsidian/canvas-patches";
import { insertSystemPrompt } from "./actions/commands/insertSystemPrompt";
import { runPromptFolder } from "./actions/commands/runPromptFolder";
import { InputModal } from "./modals/InputModal";
import { runYoutubeCaptions } from "./actions/commands/youtubeCaptions";
import { insertWebsiteContent } from "./actions/commands/websiteContent";

// @ts-expect-error
import promptsCsvText from "./data/prompts.csv.txt";

export default class AugmentedCanvasPlugin extends Plugin {
	triggerByPlugin: boolean = false;
	patchSucceed: boolean = false;

	settings: AugmentedCanvasSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		// this.registerCommands();
		// this.registerCanvasEvents();
		// this.registerCustomIcons();

		// this.patchCanvas();
		this.app.workspace.onLayoutReady(() => {
			initLogDebug(this.settings);

			this.patchCanvasMenu();
			this.addCommands();
			this.patchNoteContextMenu();

			if (this.settings.systemPrompts.length === 0) {
				this.fetchSystemPrompts();
			}
		});
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

			// console.log("canvasView", canvasView);
			// TODO: check if this is working (not working in my vault, but works in the sample vault (no .canvas ...))
			const menu = (canvasView as CanvasView)?.canvas?.menu;
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

						// // * If group
						// if (node.unknownData.type === "group") return result;

						if (this.menuEl.querySelector(".gpt-menu-item"))
							return result;

						// * If Edge
						const selectedNode = Array.from(
							maybeCanvasView.canvas?.selection
						)[0];
						if (
							// @ts-expect-error
							selectedNode.from
						) {
							if (!selectedNode.unknownData.isGenerated) return;
							addRegenerateResponse(app, settings, this.menuEl);
						} else {
							// * Handles "Call GPT" button

							addAskAIButton(app, settings, this.menuEl);

							// const node = <CanvasNode>(
							// 	Array.from(this.canvas.selection)?.first()
							// );

							// if (!node?.unknownData.questions?.length) return;

							// * Handles "Ask Question" button
							// TODO: refactor (as above)

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
							buttonEl_AskQuestion.addEventListener(
								"click",
								() => {
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
								}
							);

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
							setIcon(
								buttonEl_AIQuestions,
								"lucide-file-question"
							);
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
						}
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
		// const response = await fetch(
		// 	"https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv"
		// );
		// const text = await response.text();
		const parsedCsv = parseCsv(promptsCsvText);
		// console.log({ parsedCsv });

		const systemPrompts: SystemPrompt[] = parsedCsv
			.slice(1)
			.map((value: string[], index: number) => ({
				id: index,
				act: value[0],
				prompt: value[1],
			}));
		// console.log({ systemPrompts });

		this.settings.systemPrompts = systemPrompts;

		this.saveSettings();
	}

	patchNoteContextMenu() {
		const settings = this.settings;
		// * no event name to add to Canvas context menu ("canvas-menu" does not exist)
		this.registerEvent(
			this.app.workspace.on("canvas:node-menu", (menu) => {
				menu.addSeparator();
				menu.addItem((item) => {
					item.setTitle("Create flashcards")
						.setIcon("lucide-wallet-cards")
						.onClick(() => {
							createFlashcards(this.app, settings);
						});
				});
				menu.addItem((item) => {
					item.setTitle("Generate image")
						.setIcon("lucide-image")
						.onClick(() => {
							handleGenerateImage(this.app, settings);
						});
				});
			})
		);
	}

	addCommands() {
		const app = this.app;

		// * Website to MD
		// this.addCommand({
		// 	id: "insert-website-content",
		// 	name: "Insert the content of a website as markdown",
		// 	checkCallback: (checking: boolean) => {
		// 		if (checking) {
		// 			// console.log({ checkCallback: checking });
		// 			if (!getActiveCanvas(app)) return false;

		// 			return true;
		// 		}

		// 		new InputModal(
		// 			app,
		// 			{
		// 				label: "Enter a website url",
		// 				buttonLabel: "Get website content",
		// 			},
		// 			(videoUrl: string) => {
		// 				new Notice(`Scraping website content`);

		// 				insertWebsiteContent(app, this.settings, videoUrl);
		// 			}
		// 		).open();
		// 	},
		// 	// callback: () => {},
		// });

		// * Youtube captions
		// this.addCommand({
		// 	id: "insert-youtube-caption",
		// 	name: "Insert captions of a Youtube video",
		// 	checkCallback: (checking: boolean) => {
		// 		if (checking) {
		// 			// console.log({ checkCallback: checking });
		// 			if (!getActiveCanvas(app)) return false;

		// 			return true;
		// 		}

		// 		new InputModal(
		// 			app,
		// 			{
		// 				label: "Enter a youtube url",
		// 				buttonLabel: "Scrape captions",
		// 			},
		// 			(videoUrl: string) => {
		// 				new Notice(`Scraping captions of youtube video`);

		// 				runYoutubeCaptions(app, this.settings, videoUrl);
		// 			}
		// 		).open();
		// 	},
		// 	// callback: () => {},
		// });

		this.addCommand({
			id: "run-prompt-folder",
			name: "Run a system prompt on a folder",
			checkCallback: (checking: boolean) => {
				if (checking) {
					// console.log({ checkCallback: checking });
					if (!getActiveCanvas(app)) return false;

					return true;
				}

				new SystemPromptsModal(
					app,
					this.settings,
					(systemPrompt: SystemPrompt) => {
						new Notice(
							`Selected system prompt ${systemPrompt.act}`
						);

						new FolderSuggestModal(app, (folder: TFolder) => {
							// new Notice(`Selected folder ${folder.path}`);
							runPromptFolder(
								app,
								this.settings,
								systemPrompt,
								folder
							);
						}).open();
					}
				).open();
			},
			// callback: () => {},
		});

		this.addCommand({
			id: "insert-system-prompt",
			name: "Insert system prompt",
			checkCallback: (checking: boolean) => {
				if (checking) {
					// console.log({ checkCallback: checking });
					if (!getActiveCanvas(app)) return false;

					return true;
				}

				new SystemPromptsModal(
					app,
					this.settings,
					(systemPrompt: SystemPrompt) =>
						insertSystemPrompt(app, systemPrompt)
				).open();
			},
			// callback: () => {},
		});

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
				handleAddRelevantQuestions(app, this.settings);
			},
			// callback: async () => {},
		});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
