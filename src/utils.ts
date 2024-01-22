import {
	App,
	Canvas,
	CanvasCoords,
	CanvasNode,
	ItemView,
	Menu,
	MenuItem,
} from "obsidian";
import CollapseControlHeader from "./ControlHeader";
import AugmentedCanvasPlugin from "./AugmentedCanvasPlugin";

const getBoundingRect = (nodes: CanvasNode[]) => {
	const bboxArray = nodes.map((t: CanvasNode) => t.getBBox());

	const minX = Math.min(...bboxArray.map((t: CanvasCoords) => t.minX));
	const minY = Math.min(...bboxArray.map((t: CanvasCoords) => t.minY));
	const maxX = Math.max(...bboxArray.map((t: CanvasCoords) => t.maxX));
	const maxY = Math.max(...bboxArray.map((t: CanvasCoords) => t.maxY));

	return {
		minX,
		minY,
		maxX,
		maxY,
	};
};
const updateSelection = (canvas: Canvas) => {
	if (canvas.menu.selection.bbox) {
		const selection = Array.from(canvas.selection);
		const currentNodesInSelection = canvas.getContainingNodes(
			canvas.menu.selection.bbox
		);
		if (currentNodesInSelection.length > 0) {
			const boundingRect = getBoundingRect(
				selection.length > currentNodesInSelection.length
					? selection
					: currentNodesInSelection
			);
			if (boundingRect) {
				canvas.menu.selection.update(boundingRect);
			}
		}
	}
};
const handleMultiNodes = (
	canvas: Canvas,
	allNodes: boolean,
	collapse: boolean
) => {
	const nodes = allNodes
		? Array.from(canvas.nodes.values())
		: (Array.from(canvas.selection) as any[]);
	const canvasData = canvas.getData();

	if (nodes && nodes.length > 0) {
		for (const node of nodes) {
			if (node.unknownData.type === "group") {
				node.headerComponent.updateNodesInGroup(collapse);
			}
			node.headerComponent?.setCollapsed(collapse);
			const nodeData = canvasData.nodes.find(
				(t: any) => t.id === node.id
			);
			if (nodeData) nodeData.collapsed = collapse;
		}
		canvas.setData(canvasData);
	}
	canvas.requestSave(true, true);
	canvas.requestFrame();
	updateSelection(canvas);
};
export const handleMultiNodesViaNodes = (
	canvas: Canvas,
	nodes: CanvasNode[],
	collapse: boolean
) => {
	const canvasData = canvas.getData();

	if (nodes && nodes.length > 0) {
		for (const node of nodes) {
			if (node.unknownData.type === "group") {
				(
					node.headerComponent as CollapseControlHeader
				).updateNodesInGroup(collapse);
			}
			(node.headerComponent as CollapseControlHeader)?.setCollapsed(
				collapse
			);
			const nodeData = canvasData.nodes.find(
				(t: any) => t.id === node.id
			);
			if (nodeData) nodeData.collapsed = collapse;
		}
		canvas.setData(canvasData);
	}
	canvas.requestSave(true, true);
	updateSelection(canvas);
};
export const handleSingleNode = (node: CanvasNode, collapse: boolean) => {
	if (node.unknownData.type === "group") {
		(node.headerComponent as CollapseControlHeader).updateNodesInGroup();
	}
	const canvasData = node.canvas.getData();
	const nodeData = canvasData.nodes.find((t: any) => t.id === node.id);
	if (nodeData) nodeData.collapsed = collapse;
	node.canvas.setData(canvasData);
	node.canvas.requestSave(true, true);
	updateSelection(node.canvas);
};
export const handleNodesViaCommands = (
	plugin: AugmentedCanvasPlugin,
	checking: boolean,
	allNodes: boolean,
	collapse: boolean
) => {
	plugin.triggerByPlugin = true;
	const currentView = plugin.app.workspace.getActiveViewOfType(ItemView);
	if (currentView && currentView.getViewType() === "canvas") {
		if (!checking) {
			const canvasView = currentView as any;
			const canvas = canvasView.canvas as Canvas;
			handleMultiNodes(canvas, allNodes, collapse);
		}

		return true;
	}
};
const createHandleContextMenu = (
	section: string,
	callback: (isFold: boolean) => Promise<void>
) => {
	return (menu: Menu) => {
		menu.addItem((item: MenuItem) => {
			const subMenu = item
				.setSection(section)
				.setTitle("Collapse node")
				.setIcon("chevrons-left-right")
				.setSubmenu();
			handleCanvasMenu(subMenu, callback);
		});
	};
};

// TODO : ask GPT and add subMenu items
export const handleCanvasMenu = (
	subMenu: Menu,
	questions: string[],
	callback: (question?: string) => Promise<void>
) => {
	if (!questions) return;

	subMenu.addItem((item: MenuItem) => {
		item
			// .setIcon("fold-vertical")
			.setTitle("Write custom question.")
			.onClick(async () => {
				await callback();
			});
	});

	questions.forEach((question: string) =>
		subMenu.addItem((item: MenuItem) => {
			item
				// .setIcon("fold-vertical")
				.setTitle(question)
				.onClick(async () => {
					await callback(question);
				});
		})
	);
	// .addItem((item: any) => {
	// 	item
	// 		.setIcon("unfold-vertical")
	// 		.setTitle("Expand selected nodes")
	// 		.onClick(async () => {
	// 			await callback(false);
	// 		});
	// });

	return subMenu;
};
export const handleSelectionContextMenu = (
	plugin: AugmentedCanvasPlugin,
	menu: Menu,
	canvas: Canvas
) => {
	plugin.triggerByPlugin = true;
	const callback = async (isFold: boolean) => {
		handleMultiNodes(canvas, false, isFold);
	};
	createHandleContextMenu("action", callback)(menu);
};
export const handleNodeContextMenu = (
	plugin: AugmentedCanvasPlugin,
	menu: Menu,
	node: CanvasNode
) => {
	plugin.triggerByPlugin = true;
	const callback = async (isFold: boolean) => {
		handleSingleNode(node, isFold);
	};
	createHandleContextMenu("canvas", callback)(menu);
};

export const refreshAllCanvasView = (app: App) => {
	const cavasLeaves = app.workspace.getLeavesOfType("canvas");
	if (!cavasLeaves || cavasLeaves.length === 0) return;
	for (const leaf of cavasLeaves) {
		leaf.rebuildView();
	}
};

export const getSelectionCoords = (dom: HTMLElement) => {
	const domHTML = dom.outerHTML;

	const translateRegex = /translate\((-?\d+\.?\d*)px, (-?\d+\.?\d*)px\)/;
	const sizeRegex = /width: (\d+\.?\d*)px; height: (\d+\.?\d*)px;/;
	const translateMatches = domHTML.match(translateRegex);
	const sizeMatches = domHTML.match(sizeRegex);
	if (translateMatches && sizeMatches) {
		const x = parseFloat(translateMatches[1]);
		const y = parseFloat(translateMatches[2]);

		const width = parseFloat(sizeMatches[1]);
		const height = parseFloat(sizeMatches[2]);

		return {
			minX: x,
			minY: y,
			maxX: x + width,
			maxY: y + height,
		};
	}
};

// from obsidian-chat-stream

/**
 * Generate a string of random hexadecimal chars
 */
export const randomHexString = (len: number) => {
	const t = [];
	for (let n = 0; n < len; n++) {
		t.push(((16 * Math.random()) | 0).toString(16));
	}
	return t.join("");
};
