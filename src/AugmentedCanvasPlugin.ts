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
import CollapseControlHeader from "./ControlHeader";
import { handleCanvasMenu } from "./utils";
import { handleCallGPT, handleCallGPT_Question } from "./advancedCanvas";
import {
	AugmentedCanvasSettings,
	DEFAULT_SETTINGS,
} from "./settings/AugmentedCanvasSettings";
import SettingsTab from "./settings/SettingsTab";
import { CustomQuestionModal } from "./CustomQuestionModal";
import { CanvasNode } from "./obsidian/canvas-internal";

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
		setTimeout(() => this.patchCanvasMenu(), 20);
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

						// * Handles Call GPT button

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

						// * Handles Ask Questions button

						const buttonEl_AskQuestions = createEl(
							"button",
							"clickable-icon gpt-menu-item"
						);
						setTooltip(
							buttonEl_AskQuestions,
							"Ask questions with AI",
							{
								placement: "top",
							}
						);
						setIcon(buttonEl_AskQuestions, "lucide-file-question");
						this.menuEl.appendChild(buttonEl_AskQuestions);
						buttonEl_AskQuestions.addEventListener(
							"click",
							async () => {
								const pos =
									buttonEl_AskQuestions.getBoundingClientRect();
								if (
									!buttonEl_AskQuestions.hasClass(
										"has-active-menu"
									)
								) {
									buttonEl_AskQuestions.toggleClass(
										"has-active-menu",
										true
									);
									const menu = new Menu();
									// const containingNodes =
									// 	this.canvas.getContainingNodes(
									// 		this.selection.bbox
									// 	);

									const node = <CanvasNode>(
										Array.from(
											this.canvas.selection
										)?.first()
									);

									handleCanvasMenu(
										app,
										settings,
										node,
										menu,
										async (question?: string) => {
											if (!question) {
												let modal =
													new CustomQuestionModal(
														app,
														(question2: string) => {
															handleCallGPT_Question(
																app,
																settings,
																<CanvasNode>(
																	Array.from(
																		this
																			.canvas
																			.selection
																	)?.first()
																),
																question2
															);
															// Handle the input
														}
													);
												modal.open();
											} else {
												handleCallGPT_Question(
													app,
													settings,
													<CanvasNode>(
														Array.from(
															this.canvas
																.selection
														)?.first()
													),
													question
												);
											}
										}
									);
									menu.setParentElement(
										this.menuEl
									).showAtPosition({
										x: pos.x,
										y: pos.bottom,
										width: pos.width,
										overlap: true,
									});
								}
							}
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

	patchCanvasInteraction() {
		const patchInteraction = () => {
			const canvasView = this.app.workspace
				.getLeavesOfType("canvas")
				.first()?.view;
			if (!canvasView) return false;

			const canvas = (canvasView as CanvasView)?.canvas
				.nodeInteractionLayer;
			if (!canvas) return false;

			const uninstaller = around(canvas.constructor.prototype, {
				render: (next: any) =>
					function (...args: any) {
						const result = next.call(this, ...args);
						if (!this.target) return result;
						const isCollapsed =
							this.target.nodeEl.hasClass("collapsed");
						const isGroupNodesCollapsed =
							this.target.nodeEl.hasClass(
								"group-nodes-collapsed"
							);

						if (this.target.unknownData) {
							this.interactionEl.toggleClass(
								"collapsed-interaction",
								isCollapsed
							);
						}
						this.interactionEl.toggleClass(
							"group-nodes-collapsed",
							isGroupNodesCollapsed
						);
						return result;
					},
			});
			this.register(uninstaller);

			return true;
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchInteraction()) {
				const evt = this.app.workspace.on("layout-change", () => {
					patchInteraction() && this.app.workspace.offref(evt);
				});
				this.registerEvent(evt);
			}
		});
	}

	patchCanvasNode() {
		const initControlHeader = (node: any) => {
			return new CollapseControlHeader(node);
		};

		const patchNode = () => {
			const canvasView = this.app.workspace
				.getLeavesOfType("canvas")
				.first()?.view;
			if (!canvasView) return false;

			const canvas: Canvas = (canvasView as CanvasView)?.canvas;
			if (!canvas) return false;

			const node = (
				this.app.workspace.getLeavesOfType("canvas").first()
					?.view as any
			).canvas.nodes
				.values()
				.next().value;

			if (!node) return false;
			let prototype = Object.getPrototypeOf(node);
			while (prototype && prototype !== Object.prototype) {
				prototype = Object.getPrototypeOf(prototype);
				// @ts-expected-error Find the parent prototype
				if (prototype.renderZIndex) {
					break;
				}
			}

			if (!prototype) return false;

			const uninstaller = around(prototype, {
				render: (next: any) =>
					function (...args: any) {
						const result = next.call(this, ...args);
						if (
							this.nodeEl.querySelector(
								".canvas-node-collapse-control"
							)
						)
							return result;

						this.headerComponent = initControlHeader(this);
						(this.containerEl as HTMLDivElement).prepend(
							this.headerComponent.onload()
						);

						if (this.unknownData.collapsed) {
							this.nodeEl.classList.add("collapsed");
							this.headerComponent.updateEdges();
						}
						return result;
					},
				getBBox: (next: any) =>
					function (containing?: boolean) {
						const result = next.call(this);
						if (
							containing !== true &&
							(this.nodeEl as HTMLDivElement).hasClass(
								"collapsed"
							)
						) {
							const x = this.x;
							const y = this.y;
							const width = this.width;
							const height = 40;
							return {
								minX: x,
								minY: y,
								maxX: x + width,
								maxY: y + height,
							};
						}
						return result;
					},
				setData: (next: any) =>
					function (data: any) {
						if (data.collapsed !== undefined) {
							this.headerComponent?.setCollapsed(data.collapsed);
						}
						return next.call(this, data);
					},
			});
			this.register(uninstaller);

			return true;
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchNode()) {
				const evt = this.app.workspace.on("layout-change", () => {
					patchNode() && this.app.workspace.offref(evt);
				});
				this.registerEvent(evt);
			}
		});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
