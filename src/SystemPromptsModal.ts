import { Editor, Notice, SuggestModal, App } from "obsidian";
import { getActiveCanvas } from "./utils";
import {
	AugmentedCanvasSettings,
	SystemPrompt,
} from "./settings/AugmentedCanvasSettings";

/**
 * A serchable modal that allows the user to select a checkbox status symbol
 */
export default class QuickActionModal extends SuggestModal<SystemPrompt> {
	settings: AugmentedCanvasSettings;

	/**
	 *
	 * @param app Obsidian instance
	 * @param plugin plugin instance
	 * @param editor editor instance
	 */
	constructor(app: App, settings: AugmentedCanvasSettings) {
		super(app);
		this.settings = settings;
	}

	/**
	 * filters the checkbox options; the results are used as suggestions
	 * @param query the search string
	 * @returns collection of options
	 */
	getSuggestions(query: string): SystemPrompt[] {
		return this.settings.systemPrompts;
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
		console.log({ canvas });
		if (!canvas) return;

		// @ts-expect-error
		const newNode = canvas.createTextNode({
			pos: { x: canvas.x, y: canvas.y },
			// position: "left",
			// size: { height, width },
			text: `
SYSTEM PROMPT

${systemPrompt.prompt}
			`,
			focus: false,
		});
		// @ts-expect-error
		canvas.addNode(newNode);
		// canvas.menu.menuEl.append(new MenuItem())
	}
}
