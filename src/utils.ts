import { App, Canvas, CanvasCoords, ItemView, Menu, MenuItem } from "obsidian";
import CollapseControlHeader from "./ControlHeader";
import AugmentedCanvasPlugin from "./AugmentedCanvasPlugin";
import { handleCallGPT_Questions } from "./advancedCanvas";
import { AugmentedCanvasSettings } from "./settings/AugmentedCanvasSettings";
import { CanvasNode } from "./obsidian/canvas-internal";

// TODO : ask GPT and add subMenu items
export const handleCanvasMenu = async (
	app: App,
	settings: AugmentedCanvasSettings,
	node: CanvasNode,
	subMenu: Menu,
	// questions: string[],
	callback: (question?: string) => Promise<void>
) => {
	const questions = node.unknownData.questions;
	if (!questions) {
		subMenu.addItem((item: MenuItem) => {
			item
				// .setIcon("fold-vertical")
				.setTitle("Write custom question")
				.onClick(async () => {
					await callback();
				});
		});
		return;
	}

	// const questions = await handleCallGPT_Questions(app, settings, node);
	// console.log({ questions })
	// if (!questions) return;

	// subMenu.removeChild(item1);

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

	subMenu.addItem((item: MenuItem) => {
		item
			// .setIcon("fold-vertical")
			.setTitle("Write custom question.")
			.onClick(async () => {
				await callback();
			});
	});

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
