import { CanvasView } from "./obsidian/canvas-patches";
import { CanvasNode } from "./obsidian/canvas-internal";
import { App, Notice } from "obsidian";
import { getActiveCanvas } from "./utils";
import { readNodeContent } from "./obsidian/fileUtil";
import {
	AugmentedCanvasSettings,
	DEFAULT_SETTINGS,
} from "./settings/AugmentedCanvasSettings";
import { getResponse } from "./chatgpt";
import { getTokenLimit } from "./noteGenerator";

const FLASHCARDS_SYSTEM_PROMPT = `
You must respond in this JSON format: {
	"filename": The filename,
	"flashcards": {
		"front": string,
		"back": string
	}[]
}

You must respond in the language the user used, default to english.
`.trim();

export const createFlashcards = async (
	app: App,
	settings: AugmentedCanvasSettings
) => {
	const canvas = getActiveCanvas(app);
	if (!canvas) return;

	new Notice("Flashcard file being created...");

	const node = <CanvasNode>Array.from(canvas.selection)?.first()!;

	const nodeText = (await readNodeContent(node))?.trim() || "";

	// TODO : respect token limit
	// const encoding = encodingForModel(
	// 	(settings.apiModel || DEFAULT_SETTINGS.apiModel) as TiktokenModel
	// );

	// const inputLimit = getTokenLimit(settings);

	// let nodeTokens = encoding.encode(nodeText);

	// const keepTokens = nodeTokens.slice(0, inputLimit - tokenCount - 1);
	// const truncateTextTo = encoding.decode(keepTokens).length;
	// // console.log(
	// // 	`Truncating node text from ${nodeText.length} to ${truncateTextTo} characters`
	// // );
	// nodeText = nodeText.slice(0, truncateTextTo);

	const gptResponse = await getResponse(
		settings.apiKey,
		[
			{
				role: "system",
				content: `${FLASHCARDS_SYSTEM_PROMPT}

${settings.flashcardsSystemPrompt}`,
			},
			{
				role: "user",
				content: nodeText,
			},
		],
		{
			model: settings.apiModel,
			max_tokens: settings.maxResponseTokens || undefined,
			temperature: settings.temperature,
			isJSON: true,
		}
	);
	// console.log({ gptResponse });

	const content = `
${gptResponse.flashcards
	.map(
		(flashcard: { front: string; back: string }) =>
			`${flashcard.front}::${flashcard.back}`
		// 			`#Q
		// ${flashcard.front}::${flashcard.back}`
	)
	.join("\n\n")}
`.trim();

	//  TODO : replace with settings value
	const FLASHCARDS_PATH = "Home/Flashcards";
	try {
		await app.vault.createFolder(
			`${FLASHCARDS_PATH}/${gptResponse.filename}`
		);
	} catch {}
	await app.vault.create(
		`${FLASHCARDS_PATH}/${gptResponse.filename}/${gptResponse.filename}.md`,
		content
	);

	new Notice(`Flashcard file "${gptResponse.filename}" created successfully`);

	// await app.workspace.openLinkText(
	// 	`Flashcards/${gptResponse.filename}.md`,
	// 	""
	// );
};
