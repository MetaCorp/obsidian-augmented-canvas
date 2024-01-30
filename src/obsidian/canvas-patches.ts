import { ItemView } from "obsidian";
import { AllCanvasNodeData } from "obsidian/canvas";
import { randomHexString } from "../utils";
import { Canvas, CanvasNode, CreateNodeOptions } from "./canvas-internal";

export interface CanvasEdgeIntermediate {
	fromOrTo: string;
	side: string;
	node: CanvasElement;
}

interface CanvasElement {
	id: string;
}

export type CanvasView = ItemView & {
	canvas: Canvas;
};

/**
 * Minimum width for new notes
 */
const minWidth = 360;

/**
 * Assumed pixel width per character
 */
const pxPerChar = 5;

/**
 * Assumed pixel height per line
 */
const pxPerLine = 28;

/**
 * Assumed height of top + bottom text area padding
 */
const textPaddingHeight = 12;

/**
 * Margin between new notes
 */
const newNoteMargin = 60;
const newNoteMarginWithLabel = 110;

/**
 * Min height of new notes
 */
const minHeight = 60;

/**
 * Choose height for generated note based on text length and parent height.
 * For notes beyond a few lines, the note will have scroll bar.
 * Not a precise science, just something that is not surprising.
 */
export const calcHeight = (options: { parentHeight: number; text: string }) => {
	const calcTextHeight = Math.round(
		textPaddingHeight +
			(pxPerLine * options.text.length) / (minWidth / pxPerChar)
	);
	return calcTextHeight;
	// return Math.max(options.parentHeight, calcTextHeight);
};

const DEFAULT_NODE_WIDTH = 400;
const DEFAULT_NODE_HEIGHT = DEFAULT_NODE_WIDTH * (1024 / 1792) + 20;

/**
 * Create new node as descendant from the parent node.
 * Align and offset relative to siblings.
 */
export const createNode = (
	canvas: Canvas,
	nodeOptions: CreateNodeOptions,
	parentNode?: CanvasNode,
	nodeData?: Partial<AllCanvasNodeData>,
	edgeLabel?: string
) => {
	if (!canvas) {
		throw new Error("Invalid arguments");
	}

	const { text } = nodeOptions;
	const width = parentNode
		? nodeOptions?.size?.width || Math.max(minWidth, parentNode?.width)
		: DEFAULT_NODE_WIDTH;
	const height = parentNode
		? nodeOptions?.size?.height ||
		  Math.max(
				minHeight,
				parentNode &&
					calcHeight({ text, parentHeight: parentNode.height })
		  )
		: DEFAULT_NODE_HEIGHT;

	// @ts-expect-error
	let x = canvas.x - width / 2;
	// @ts-expect-error
	let y = canvas.y - height / 2;

	if (parentNode) {
		const siblings =
			parent &&
			canvas
				.getEdgesForNode(parentNode)
				.filter((n) => n.from.node.id == parentNode.id)
				.map((e) => e.to.node);

		// Failsafe leftmost value.
		const farLeft = parentNode.y - parentNode.width * 5;
		const siblingsRight = siblings?.length
			? siblings.reduce(
					(right, sib) => Math.max(right, sib.x + sib.width),
					farLeft
			  )
			: undefined;
		const priorSibling = siblings[siblings.length - 1];

		// Position left at right of prior sibling, otherwise aligned with parent
		x =
			siblingsRight != null
				? siblingsRight + newNoteMargin
				: parentNode.x;

		// Position top at prior sibling top, otherwise offset below parent
		y =
			(priorSibling
				? priorSibling.y
				: parentNode.y +
				  parentNode.height +
				  (edgeLabel ? newNoteMarginWithLabel : newNoteMargin)) +
			// Using position=left, y value is treated as vertical center
			height * 0.5;
	}

	const newNode = canvas.createTextNode({
		pos: { x, y },
		position: "left",
		size: { height, width },
		text,
		focus: false,
	});

	if (nodeData) {
		newNode.setData(nodeData);
	}

	canvas.deselectAll();
	canvas.addNode(newNode);

	if (parentNode) {
		addEdge(
			canvas,
			randomHexString(16),
			{
				fromOrTo: "from",
				side: "bottom",
				node: parentNode,
			},
			{
				fromOrTo: "to",
				side: "top",
				node: newNode,
			},
			edgeLabel
		);
	}

	return newNode;
};

/**
 * Add edge entry to canvas.
 */
export const addEdge = (
	canvas: Canvas,
	edgeID: string,
	fromEdge: CanvasEdgeIntermediate,
	toEdge: CanvasEdgeIntermediate,
	label?: string
) => {
	if (!canvas) return;

	const data = canvas.getData();

	if (!data) return;

	canvas.importData({
		edges: [
			...data.edges,
			{
				id: edgeID,
				fromNode: fromEdge.node.id,
				fromSide: fromEdge.side,
				toNode: toEdge.node.id,
				toSide: toEdge.side,
				label,
			},
		],
		nodes: data.nodes,
	});

	canvas.requestFrame();
};

/**
 * Trap exception and write to console.error.
 */
export function trapError<T>(fn: (...params: unknown[]) => T) {
	return (...params: unknown[]) => {
		try {
			return fn(...params);
		} catch (e) {
			console.error(e);
		}
	};
}
