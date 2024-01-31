import { Menu, MenuItem } from "obsidian";

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
