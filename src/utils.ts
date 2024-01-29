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
import { CanvasView } from "./obsidian/canvas-patches";
import { readFileContent } from "./obsidian/fileUtil";

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
		x: 0 - ((NOTE_WIDTH + NOTE_GAP) * NOTES_BY_ROW) / 2,
		y: 0 - ((NOTE_HEIGHT + NOTE_GAP) * 2) / 2,
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
	// TODO : does not work
	newGroup.label = groupName;

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
