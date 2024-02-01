import { App, setIcon, setTooltip } from "obsidian";
import { getTokenLimit, noteGenerator } from "./noteGenerator";
import { AugmentedCanvasSettings } from "../../settings/AugmentedCanvasSettings";
import { CanvasNode } from "../../obsidian/canvas-internal";
import { getResponse } from "../../utils/chatgpt";
import { getActiveCanvas, getActiveCanvasNodes } from "src/utils";

const SYSTEM_PROMPT_QUESTIONS = `
You must respond in this JSON format: {
	"questions": Follow up questions the user could ask based on the chat history, must be an array
}
The questions must be asked in the same language the user used.
`.trim();

export const addAskAIButton = async (
	app: App,
	settings: AugmentedCanvasSettings,
	menuEl: HTMLElement
) => {
	const buttonEl_AskAI = createEl("button", "clickable-icon gpt-menu-item");
	setTooltip(buttonEl_AskAI, "Ask AI", {
		placement: "top",
	});
	setIcon(buttonEl_AskAI, "lucide-sparkles");
	menuEl.appendChild(buttonEl_AskAI);

	buttonEl_AskAI.addEventListener("click", async () => {
		const { generateNote } = noteGenerator(app, settings);

		await generateNote();
	});
};

export const handleCallGPT_Question = async (
	app: App,
	settings: AugmentedCanvasSettings,
	node: CanvasNode,
	question: string
) => {
	if (node.unknownData.type === "group") {
		return;
	}

	const { generateNote } = noteGenerator(app, settings);
	await generateNote(question);
};

export const handleCallGPT_Questions = async (
	app: App,
	settings: AugmentedCanvasSettings,
	node: CanvasNode
) => {
	const { buildMessages } = noteGenerator(app, settings);
	const { messages, tokenCount } = await buildMessages(node, {
		systemPrompt: SYSTEM_PROMPT_QUESTIONS,
	});
	if (messages.length <= 1) return;

	const gptResponse = await getResponse(
		settings.apiKey,
		// settings.apiModel,
		messages,
		{
			model: settings.apiModel,
			max_tokens: settings.maxResponseTokens || undefined,
			// max_tokens: getTokenLimit(settings) - tokenCount - 1,
			temperature: settings.temperature,
			isJSON: true,
		}
	);

	return gptResponse.questions;
};

const handleRegenerateResponse = async (
	app: App,
	settings: AugmentedCanvasSettings
) => {
	const activeNode = getActiveCanvasNodes(app)![0];

	// const canvas = getActiveCanvas(app);

	// // @ts-expect-error
	// const toNode = activeNode.to.node;

	// console.log({ toNode });

	// canvas!.removeNode(toNode);
	// canvas?.requestSave();

	const { generateNote } = noteGenerator(
		app,
		settings,
		// @ts-expect-error
		activeNode.from.node,
		// @ts-expect-error
		activeNode.to.node
	);

	await generateNote();
};

export const addRegenerateResponse = async (
	app: App,
	settings: AugmentedCanvasSettings,
	menuEl: HTMLElement
) => {
	const buttonEl_AskAI = createEl("button", "clickable-icon gpt-menu-item");
	setTooltip(buttonEl_AskAI, "Regenerate response", {
		placement: "top",
	});
	// TODO
	setIcon(buttonEl_AskAI, "lucide-rotate-cw");
	menuEl.appendChild(buttonEl_AskAI);

	buttonEl_AskAI.addEventListener("click", () =>
		handleRegenerateResponse(app, settings)
	);
};
