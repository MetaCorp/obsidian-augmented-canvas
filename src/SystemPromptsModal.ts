import { Editor, Notice, SuggestModal, App } from "obsidian";
import { getActiveCanvas } from "./utils";
import {
	AugmentedCanvasSettings,
	SystemPrompt,
} from "./settings/AugmentedCanvasSettings";
import { calcHeight } from "./obsidian/canvas-patches";
import Fuse, { FuseResult } from "fuse.js";

/**
 * A serchable modal that allows the user to select a checkbox status symbol
 */
export default class QuickActionModal extends SuggestModal<SystemPrompt> {
	settings: AugmentedCanvasSettings;
	fuse: Fuse<SystemPrompt>;

	/**
	 *
	 * @param app Obsidian instance
	 * @param plugin plugin instance
	 * @param editor editor instance
	 */
	constructor(app: App, settings: AugmentedCanvasSettings) {
		super(app);
		this.settings = settings;

		const fuse = new Fuse(this.settings.systemPrompts, {
			keys: ["act", "prompt"],
		});
		this.fuse = fuse;
	}

	/**
	 * filters the checkbox options; the results are used as suggestions
	 * @param query the search string
	 * @returns collection of options
	 */
	getSuggestions(query: string): SystemPrompt[] {
		if (query === "") return this.settings.systemPrompts;

		return this.fuse
			.search(query)
			.map((result: FuseResult<SystemPrompt>) => result.item);

		return this.settings.systemPrompts.filter(
			(systemPrompt: SystemPrompt) => {
				if (query === "") return true;

				const promptWords = systemPrompt.prompt.split(/ /g);
				const actWords = systemPrompt.act.split(/ /g);

				return (
					promptWords.filter((word: string) => word.includes(query))
						.length > 0 ||
					actWords.filter((word: string) => word.includes(query))
						.length > 0
				);
			}
		);
	}

	/**
	 * renders each suggestion
	 * @param option the checkbox option to display
	 * @param el the suggestion HTML element
	 */
	renderSuggestion(systemPrompt: SystemPrompt, el: HTMLElement) {
		el.setCssStyles({
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			textAlign: "center",
		});

		const input = el.createEl("span", {
			text: systemPrompt.act,
		});
	}

	/**
	 * Handler for when the user chooses an option
	 * @param option the option selected by the user
	 * @param evt the triggering mouse or keyboard event
	 */
	onChooseSuggestion(
		systemPrompt: SystemPrompt,
		evt: MouseEvent | KeyboardEvent
	) {
		new Notice(`Selected ${systemPrompt.act}`);

		const canvas = getActiveCanvas(this.app);
		if (!canvas) return;

		const text = `
SYSTEM PROMPT

${systemPrompt.prompt.trim()}
`.trim();

		const NODE_WIDTH = 800;
		const NODE_HEIGHT = 300;
		// @ts-expect-error
		const newNode = canvas.createTextNode({
			pos: {
				x: canvas.x - NODE_WIDTH / 2,
				y: canvas.y - NODE_HEIGHT / 2,
			},
			// position: "left",
			size: {
				height: calcHeight({ parentHeight: NODE_HEIGHT, text }),
				width: NODE_WIDTH,
			},
			text,
			focus: false,
		});
		// @ts-expect-error
		canvas.addNode(newNode);
		// canvas.menu.menuEl.append(new MenuItem())
	}
}
