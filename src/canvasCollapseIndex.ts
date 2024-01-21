import {
	addIcon,
	Canvas,
	CanvasCoords,
	CanvasGroupNode,
	CanvasNode,
	CanvasView,
	Menu,
	Plugin,
	setIcon,
	setTooltip,
} from "obsidian";
import { around } from "monkey-around";
import CollapseControlHeader from "./ControlHeader";
import { CanvasData } from "obsidian/canvas";
import {
	getSelectionCoords,
	handleCanvasMenu,
	handleMultiNodesViaNodes,
	handleNodeContextMenu,
	handleNodesViaCommands,
	handleSelectionContextMenu,
	handleSingleNode,
	refreshAllCanvasView,
} from "./utils";
import { handleCallGPT } from "./advancedCanvas";
import { noteGenerator } from "./noteGenerator";

export default class CanvasCollapsePlugin extends Plugin {
	triggerByPlugin: boolean = false;
	patchSucceed: boolean = false;

	async onload() {
		this.registerCommands();
		// this.registerCanvasEvents();
		this.registerCustomIcons();

		this.patchCanvas();
		this.patchCanvasMenu();
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
		console.log("unloading plugin");
		refreshAllCanvasView(this.app);
	}

	registerCommands() {
		this.addCommand({
			id: "fold-all-nodes",
			name: "Fold all nodes",
			checkCallback: (checking: boolean) =>
				handleNodesViaCommands(this, checking, true, true),
		});

		this.addCommand({
			id: "expand-all-nodes",
			name: "Expand all nodes",
			checkCallback: (checking: boolean) =>
				handleNodesViaCommands(this, checking, true, false),
		});

		this.addCommand({
			id: "fold-selected-nodes",
			name: "Fold selected nodes",
			checkCallback: (checking: boolean) =>
				handleNodesViaCommands(this, checking, false, true),
		});

		this.addCommand({
			id: "expand-selected-nodes",
			name: "Expand selected nodes",
			checkCallback: (checking: boolean) =>
				handleNodesViaCommands(this, checking, false, false),
		});
	}

	registerCanvasEvents() {
		this.registerEvent(
			this.app.workspace.on("collapse-node:patched-canvas", () => {
				refreshAllCanvasView(this.app);
			})
		);
		this.registerEvent(
			this.app.workspace.on("canvas:selection-menu", (menu, canvas) => {
				handleSelectionContextMenu(this, menu, canvas);
			})
		);
		this.registerEvent(
			this.app.workspace.on("canvas:node-menu", (menu, node) => {
				handleNodeContextMenu(this, menu, node);
			})
		);
	}

	registerCustomIcons() {
		addIcon(
			"fold-vertical",
			`<g id="surface1"><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 12 22.000312 L 12 16.000312 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 12 7.999687 L 12 1.999687 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 4.000312 12 L 1.999687 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 10.000312 12 L 7.999687 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 16.000312 12 L 13.999688 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 22.000312 12 L 19.999688 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 15 19.000312 L 12 16.000312 L 9 19.000312 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 15 4.999687 L 12 7.999687 L 9 4.999687 " transform="matrix(4.166667,0,0,4.166667,0,0)"/></g>`
		);
		addIcon(
			"unfold-vertical",
			`<g id="surface1"><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 12 22.000312 L 12 16.000312 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 12 7.999687 L 12 1.999687 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 4.000312 12 L 1.999687 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 10.000312 12 L 7.999687 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 16.000312 12 L 13.999688 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 22.000312 12 L 19.999688 12 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 15 19.000312 L 12 22.000312 L 9 19.000312 " transform="matrix(4.166667,0,0,4.166667,0,0)"/><path style="fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 15 4.999687 L 12 1.999687 L 9 4.999687 " transform="matrix(4.166667,0,0,4.166667,0,0)"/></g>`
		);
	}

	patchCanvas() {
		const checkCoords = (e: CanvasCoords, t: CanvasCoords) => {
			return (
				e.minX <= t.minX &&
				e.minY <= t.minY &&
				e.maxX >= t.maxX &&
				e.maxY >= t.maxY
			);
		};

		const checkTriggerByPlugin = () => {
			return this.triggerByPlugin;
		};

		const toggleTriggerByPlugin = () => {
			this.triggerByPlugin = !this.triggerByPlugin;
		};

		const patchCanvas = () => {
			const canvasView = this.app.workspace
				.getLeavesOfType("canvas")
				.first()?.view;
			if (!canvasView) return false;

			const canvas: Canvas = (canvasView as CanvasView)?.canvas;
			if (!canvas) return false;

			const uninstaller = around(canvas.constructor.prototype, {
				getContainingNodes: (next: any) =>
					function (e: CanvasCoords) {
						const result = next.call(this, e);

						const checkExistGroupNode: CanvasNode | null =
							this.nodeIndex
								.search(e)
								.find(
									(t: CanvasNode) =>
										t.unknownData.type === "group" ||
										(t as CanvasGroupNode).label
								);
						if (!checkExistGroupNode) return result;
						const renewCoords = checkExistGroupNode?.getBBox(true);
						if (renewCoords !== e && e.maxY - e.minY === 40) {
							const newResult = this.nodeIndex
								.search(renewCoords)
								.filter((t: any) => {
									return checkCoords(
										renewCoords,
										t.getBBox(true)
									);
								});
							if (newResult.length > result.length) {
								return newResult;
							}
						}
						return result;
					},
				requestSave: (next: any) =>
					function (args?: boolean, triggerBySelf?: boolean) {
						next.call(this, args);
						if (triggerBySelf) {
							if (args !== undefined) {
								this.data = this.getData();
								args && this.requestPushHistory(this.data);
							}
						}
					},
				pushHistory: (next: any) =>
					function (args: CanvasData) {
						if (checkTriggerByPlugin()) {
							toggleTriggerByPlugin();
							return;
						}
						return next.call(this, args);
					},
				selectAll: (next: any) =>
					function (e: Set<CanvasNode>) {
						if (this.wrapperEl.querySelector(".canvas-selection")) {
							const domCoords = getSelectionCoords(
								this.wrapperEl.querySelector(
									".canvas-selection"
								) as HTMLElement
							);
							if (domCoords) {
								const newResult = Array.from(e).filter(
									(t: CanvasNode) => {
										if (!t.unknownData.collapsed)
											return true;
										if (
											t.nodeEl.hasClass(
												"group-nodes-collapsed"
											)
										)
											return false;
										return checkCoords(
											domCoords,
											t.getBBox()
										);
									}
								);
								if (newResult.length > 0) {
									const ne = new Set(newResult);
									return next.call(this, ne);
								}
								if (newResult.length === 0) {
									return;
								}
							}
						}
						return next.call(this, e);
					},
				createTextNode: (next: any) =>
					function (args: any) {
						if (args.size === undefined && args.pos) {
							return next.call(this, {
								...args,
								pos: {
									x: args.pos.x,
									y: args.pos.y,
									width: args?.size?.width || 250,
									height: args?.size?.height || 140,
								},
								size: {
									x: args.pos.x,
									y: args.pos.y,
									width: args?.size?.width || 250,
									height: args?.size?.height || 140,
								},
							});
						}
						return next.call(this, args);
					},
				createGroupNode: (next: any) =>
					function (args: any) {
						if (args.size !== undefined && args.pos) {
							return next.call(this, {
								...args,
								pos: {
									x: args.pos.x,
									y: args.pos.y - 30,
									width: args?.size?.width,
									height: args?.size?.height + 30,
								},
								size: {
									x: args.pos.x,
									y: args.pos.y - 30,
									width: args?.size?.width,
									height: args?.size?.height + 30,
								},
							});
						}
						return next.call(this, args);
					},
			});
			this.register(uninstaller);
			this.patchSucceed = true;

			console.log("Obsidian-Collapse-Node: canvas patched");
			return true;
		};

		this.app.workspace.onLayoutReady(() => {
			if (!patchCanvas()) {
				const evt = this.app.workspace.on("layout-change", () => {
					patchCanvas() && this.app.workspace.offref(evt);
				});
				this.registerEvent(evt);
			}
		});
	}

	patchCanvasMenu() {
		const app = this.app;
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

			// TODO : remove menu items if group selection
			// console.log({
			// 	unknownData:
			// 		// @ts-expect-error
			// 		this.canvas &&
			// 		// @ts-expect-error
			// 		Array.from(this.canvas.selection)?.first().unknownData,
			// });
			// if (
			// 	// @ts-expect-error
			// 	Array.from(this.canvas.selection)?.first().unknownData.type ===
			// 	"group"
			// )
			// 	return false;

			const selection = menu.selection;
			if (!selection) return false;

			const menuUninstaller = around(menu.constructor.prototype, {
				render: (next: any) =>
					function (...args: any) {
						const result = next.call(this, ...args);
						if (this.menuEl.querySelector(".gpt-menu-item"))
							return result;

						// * Handles Call GPT button

						const buttonEl_CallGPT = createEl(
							"button",
							"clickable-icon gpt-menu-item"
						);
						setTooltip(buttonEl_CallGPT, "Call GPT", {
							placement: "top",
						});
						setIcon(buttonEl_CallGPT, "lucide-sparkles");
						this.menuEl.appendChild(buttonEl_CallGPT);

						buttonEl_CallGPT.addEventListener("click", () => {
							handleCallGPT(
								app,
								<CanvasNode>(
									Array.from(this.canvas.selection)?.first()
								)
							);
						});

						// * Handles Ask Questions button

						const buttonEl_AskQuestions = createEl(
							"button",
							"clickable-icon gpt-menu-item"
						);
						setTooltip(buttonEl_AskQuestions, "Ask questions", {
							placement: "top",
						});
						setIcon(buttonEl_AskQuestions, "lucide-file-question");
						this.menuEl.appendChild(buttonEl_AskQuestions);

						buttonEl_AskQuestions.addEventListener("click", () => {
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
								const containingNodes =
									this.canvas.getContainingNodes(
										this.selection.bbox
									);

								handleCanvasMenu(
									menu,
									// TODO : onMenuItem Click
									async (isFold: boolean) => {
										triggerPlugin();
										const currentSelection =
											this.canvas.selection;
										containingNodes.length > 1
											? handleMultiNodesViaNodes(
													this.canvas,
													containingNodes,
													isFold
											  )
											: currentSelection
											? handleSingleNode(
													<CanvasNode>(
														Array.from(
															currentSelection
														)?.first()
													),
													isFold
											  )
											: "";
										buttonEl_AskQuestions.toggleClass(
											"has-active-menu",
											false
										);
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
						});

						return result;
					},
			});

			this.register(menuUninstaller);
			this.app.workspace.trigger("collapse-node:patched-canvas");

			console.log("Obsidian-Collapse-Node: canvas history patched");
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

			console.log("Obsidian-Collapse-Node: canvas history patched");
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

			console.log("Obsidian-Collapse-Node: canvas node patched");
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
}
