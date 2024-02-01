import { App, Notice, TFolder } from "obsidian";
import { ChatCompletionMessageParam } from "openai/resources";
import { calcHeight, createNode } from "src/obsidian/canvas-patches";
import {
	AugmentedCanvasSettings,
	SystemPrompt,
} from "src/settings/AugmentedCanvasSettings";
import { getActiveCanvas } from "src/utils";
import { streamResponse } from "src/utils/chatgpt";
import {
	NOTE_INCR_HEIGHT_STEP,
	NOTE_MIN_HEIGHT,
} from "../canvasNodeMenuActions/noteGenerator";
import { readFolderMarkdownContent } from "src/obsidian/fileUtil";

export const runPromptFolder = async (
	app: App,
	settings: AugmentedCanvasSettings,
	systemPrompt: SystemPrompt,
	folder: TFolder
) => {
	const canvas = getActiveCanvas(app);
	if (!canvas) return;

	const NODE_WIDTH = 800;
	const NODE_HEIGHT = 300;
	const text = `\`\`\`Calling AI (${settings.apiModel})...\`\`\``;
	const created = createNode(canvas, {
		pos: {
			// @ts-expect-error
			x: canvas.x - NODE_WIDTH / 2,
			// @ts-expect-error
			y: canvas.y - NODE_HEIGHT / 2,
		},
		// position: "left",
		size: {
			height: calcHeight({
				// parentHeight: NODE_HEIGHT,
				text,
			}),
			width: NODE_WIDTH,
		},
		text,
		focus: false,
	});
	// canvas.menu.menuEl.append(new MenuItem())

	const folderContentText = await readFolderMarkdownContent(app, folder);

	const messages: ChatCompletionMessageParam[] = [
		{
			role: "system",
			content: systemPrompt.prompt,
		},
		{
			role: "user",
			content: folderContentText,
		},
	];

	let firstDelta = true;
	await streamResponse(
		settings.apiKey,
		// settings.apiModel,
		messages,
		{
			model: settings.apiModel,
			max_tokens: settings.maxResponseTokens || undefined,
			// max_tokens: getTokenLimit(settings) - tokenCount - 1,
		},
		(delta?: string) => {
			// * Last call
			if (!delta) {
				return;
			}

			let newText;
			if (firstDelta) {
				newText = delta;
				firstDelta = false;

				created.moveAndResize({
					height: NOTE_MIN_HEIGHT,
					width: created.width,
					x: created.x,
					y: created.y,
				});
			} else {
				const height = calcHeight({
					text: created.text,
				});
				if (height > created.height) {
					created.moveAndResize({
						height: created.height + NOTE_INCR_HEIGHT_STEP,
						width: created.width,
						x: created.x,
						y: created.y,
					});
				}
				newText = created.text + delta;
			}
			created.setText(newText);
		}
	);

	canvas.requestSave();
};
