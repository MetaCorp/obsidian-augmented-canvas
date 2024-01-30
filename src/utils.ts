import {
	App,
	Canvas,
	CanvasCoords,
	ItemView,
	Menu,
	MenuItem,
	TFile,
	CanvasGroupNode,
} from "obsidian";
import { CanvasView, createNode } from "./obsidian/canvas-patches";
import { readFileContent, readNodeContent } from "./obsidian/fileUtil";
import { CanvasNode } from "./obsidian/canvas-internal";
import { AugmentedCanvasSettings } from "./settings/AugmentedCanvasSettings";

// TODO : ask GPT and add subMenu items
export const handleCanvasMenu_Loading = async (
	subMenu: Menu,
	questions?: string[],
	callback?: (question?: string) => Promise<void>
) => {
	if (questions) {
		if (questions.length === 0) {
			subMenu.addItem((item: MenuItem) => {
				item
					// .setIcon("fold-vertical")
					.setTitle("No questions");
			});
		} else {
			questions.forEach((question: string) =>
				subMenu.addItem((item: MenuItem) => {
					item
						// .setIcon("fold-vertical")
						.setTitle(question)
						.onClick(async () => {
							callback && (await callback(question));
						});
				})
			);
		}
	} else {
		subMenu.addItem((item: MenuItem) => {
			item
				// .setIcon("fold-vertical")
				.setTitle("loading...");
		});
	}
};

// TODO : ask GPT and add subMenu items
export const handleCanvasMenu_Loaded = async (
	subMenu: Menu,
	questions: string[],
	callback: (question?: string) => Promise<void>
) => {
	// subMenu.
	if (questions.length === 0) {
		subMenu.addItem((item: MenuItem) => {
			item
				// .setIcon("fold-vertical")
				.setTitle("No questions");
		});
	} else {
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
	}

	return subMenu;
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

export const getActiveCanvas = (app: App) => {
	const maybeCanvasView = app.workspace.getActiveViewOfType(
		ItemView
	) as CanvasView | null;
	return maybeCanvasView ? maybeCanvasView["canvas"] : null;
};

export const createCanvasGroup = (
	app: App,
	groupName: string,
	notesContents: string[]
) => {
	const canvas = getActiveCanvas(app);
	if (!canvas) return;

	const NOTE_WIDTH = 500;
	const NOTE_HEIGHT = 150;
	const NOTE_GAP = 20;

	const NOTES_BY_ROW = 3;

	let startPos = {
		// @ts-expect-error
		x: canvas.x - ((NOTE_WIDTH + NOTE_GAP) * NOTES_BY_ROW) / 2,
		// @ts-expect-error
		y: canvas.y - ((NOTE_HEIGHT + NOTE_GAP) * 2) / 2,
	};

	// @ts-expect-error
	const newGroup: CanvasGroupNode = canvas.createGroupNode({
		// TODO : does not work
		label: groupName,
		pos: {
			x: startPos.x - NOTE_GAP,
			y: startPos.y - NOTE_GAP,
		},
		size: {
			width: NOTES_BY_ROW * (NOTE_WIDTH + NOTE_GAP) + NOTE_GAP,
			height: (NOTE_HEIGHT + NOTE_GAP) * 2 + NOTE_GAP,
		},
	});
	newGroup.label = groupName;
	newGroup.labelEl.setText(groupName);

	let countRow = 0;
	let countColumn = 0;
	for (const noteContent of notesContents) {
		const newNode = canvas.createTextNode({
			text: noteContent,
			pos: {
				x: startPos.x + countRow * (NOTE_WIDTH + NOTE_GAP),
				y: startPos.y + countColumn * (NOTE_HEIGHT + NOTE_GAP),
			},
			size: {
				width: NOTE_WIDTH,
				height: NOTE_HEIGHT,
			},
		});
		canvas.addNode(newNode);
		countColumn =
			countRow + 1 > NOTES_BY_ROW - 1 ? countColumn + 1 : countColumn;
		countRow = countRow + 1 > NOTES_BY_ROW - 1 ? 0 : countRow + 1;
	}

	// @ts-expect-error
	canvas.addGroup(newGroup);
};

export const canvasNodeIsNote = (canvasNode: CanvasNode) => {
	// @ts-expect-error
	return !canvasNode.from;
};

export const getActiveCanvasNodes = (app: App) => {
	const canvas = getActiveCanvas(app);
	if (!canvas) return;

	return <CanvasNode[]>Array.from(canvas.selection)!;
};

export const getCanvasActiveNoteText = (app: App) => {
	const canvasNodes = getActiveCanvasNodes(app);
	if (!canvasNodes || canvasNodes.length !== 1) return;

	const canvasNode = canvasNodes.first()!;
	if (!canvasNodeIsNote(canvasNode)) return;

	return readNodeContent(canvasNode);
};

// export const addImageToCanvas = (app: App, imageFileName: string) => {
// 	const canvas = getActiveCanvas(app);
// 	if (!canvas) return;

// 	const parentNode = getActiveCanvasNodes(app)?.[0];
// 	if (!parentNode) return;

// 	const IMAGE_WIDTH = parentNode.width;
// 	const IMAGE_HEIGHT = IMAGE_WIDTH * (1024 / 1792) + 20;

// 	createNode(
// 		canvas,
// 		{
// 			text: `![[${imageFileName}]]`,
// 			size: {
// 				width: IMAGE_WIDTH,
// 				height: IMAGE_HEIGHT,
// 			},
// 		},
// 		parentNode
// 	);

// 	canvas.requestSave();
// };

export const getImageSaveFolderPath = (settings: AugmentedCanvasSettings) => {
	return settings.imagesPath;
};
