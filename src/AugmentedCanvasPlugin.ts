import {
	Canvas,
	CanvasView,
	ItemView,
	Menu,
	Plugin,
	setIcon,
	setTooltip,
} from "obsidian";
import { around } from "monkey-around";
import { handleCallGPT, handleCallGPT_Question } from "./advancedCanvas";
import {
	AugmentedCanvasSettings,
	DEFAULT_SETTINGS,
} from "./settings/AugmentedCanvasSettings";
import SettingsTab from "./settings/SettingsTab";
import { CustomQuestionModal } from "./CustomQuestionModal";
import { CanvasNode } from "./obsidian/canvas-internal";
import { handlePatchNoteMenu } from "./noteMenuPatch";

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
		setTimeout(() => this.patchCanvasMenu(), 100);
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

		const triggerPlugin = () => {
			this.triggerByPlugin = true;
		};

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

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
