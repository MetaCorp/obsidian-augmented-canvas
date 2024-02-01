import { Editor, Notice, SuggestModal, App } from "obsidian";
import { getActiveCanvas } from "../utils";
import {
	AugmentedCanvasSettings,
	SystemPrompt,
} from "../settings/AugmentedCanvasSettings";
import { calcHeight, createNode } from "../obsidian/canvas-patches";
import Fuse, { FuseResult } from "fuse.js";

/**
 * A serchable modal that allows the user to select a checkbox status symbol
 */
export default class QuickActionModal extends SuggestModal<SystemPrompt> {
	settings: AugmentedCanvasSettings;
	fuse: Fuse<SystemPrompt>;
	onChoose: (systemPrompt: SystemPrompt) => void;

	/**
	 *
	 * @param app Obsidian instance
	 * @param plugin plugin instance
	 * @param editor editor instance
	 */
	constructor(
		app: App,
		settings: AugmentedCanvasSettings,
		onChoose: (systemPrompt: SystemPrompt) => void
	) {
		super(app);
		this.settings = settings;
		this.onChoose = onChoose;

		const fuse = new Fuse(
			[...this.settings.userSystemPrompts, ...this.settings.systemPrompts]
				.filter((systemPrompt: SystemPrompt) => systemPrompt.act)
				.sort((a, b) => a.act.localeCompare(b.act)),
			{
				keys: ["act", "prompt"],
			}
		);
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
		this.onChoose(systemPrompt);
	}
}
