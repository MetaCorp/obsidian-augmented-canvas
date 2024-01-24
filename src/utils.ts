import { App, Canvas, CanvasCoords, ItemView, Menu, MenuItem } from "obsidian";
import AugmentedCanvasPlugin from "./AugmentedCanvasPlugin";
import { handleCallGPT_Questions } from "./advancedCanvas";
import { AugmentedCanvasSettings } from "./settings/AugmentedCanvasSettings";
import { CanvasNode } from "./obsidian/canvas-internal";

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
