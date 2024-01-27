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

const SYSTEM_PROMPT = `
You will create a file containing flashcards.

The front of the flashcard must be a question.

The question must not give the answer, If the question is too precise, ask a more general question.

If there is a list in the text given by the user. Start by creating a flashcard asking about this list.

You must respond in this JSON format: {
	"filename": The filename, can be written with spaces, must not contain the word "flashcard", must tell the subjects of the flashcards,
	"flashcards": {
		"front": string,
		"back": string
	}[]
}

You must respond in the language the user used.
`.trim();

export const createFlashcards = async (
	app: App,
	settings: AugmentedCanvasSettings
) => {
	const canvas = getActiveCanvas(app);
	if (!canvas) return;

	new Notice("Flashcard file being created");

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
				content: SYSTEM_PROMPT,
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
	console.log({ gptResponse });

	const content = `
${gptResponse.flashcards
	.map(
		(flashcard: { front: string; back: string }) =>
			`#Q
${flashcard.front}::${flashcard.back}`
	)
	.join("\n\n")}
`.trim();

	const file = await app.vault.create(
		`Flashcards/${gptResponse.filename}.md`,
		content
	);

	new Notice("Flashcard file created successfully");

	// await app.workspace.openLinkText(
	// 	`Flashcards/${gptResponse.filename}.md`,
	// 	""
	// );
};
