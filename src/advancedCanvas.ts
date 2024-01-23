import { App } from "obsidian";
import { noteGenerator } from "./noteGenerator";
import { AugmentedCanvasSettings } from "./settings/AugmentedCanvasSettings";
import { CanvasNode } from "./obsidian/canvas-internal";
import { getResponse } from "./chatgpt";

const SYSTEM_PROMPT_QUESTIONS = `
You must respond in this JSON format: {
	"questions": Follow up questions the user could ask based on the chat history, must be an array
}
`.trim();

const NODE_HEIGHT = 500;

export const handleCallGPT = async (
	app: App,
	settings: AugmentedCanvasSettings,
	node: CanvasNode
) => {
	if (node.unknownData.type === "group") {
		// (node.headerComponent as CollapseControlHeader).updateNodesInGroup();
		return;
	}
	const canvasData = node.canvas.getData();
	const nodeData = canvasData.nodes.find((t: any) => t.id === node.id);

	// TODO : CallGPT and update text
	if (nodeData) {
		const { generateNote } = noteGenerator(app, settings);

		// console.log({ nodeData });
		// 		nodeData.text = `# ${nodeData.text}

		// ${gptResponse}`;

		// nodeData.gptQuestions = ["Question 1", "Question 2", "Question 3"];

		// nodeData.height =
		// 	nodeData.height > NODE_HEIGHT ? nodeData.height : NODE_HEIGHT;
		await generateNote();
		// [
		// 	{
		// 		role: "user",
		// 		content: nodeData.text,
		// 	},
		// ],
		// nodeData.width
	}

	// node.canvas.setData(canvasData);
	// node.canvas.requestSave(true, true);

	// updateSelection(node.canvas);
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
	const canvasData = node.canvas.getData();
	const nodeData = canvasData.nodes.find((t: any) => t.id === node.id);

	// TODO : CallGPT and update text
	if (nodeData) {
		const { generateNote } = noteGenerator(app, settings);
		await generateNote(question);
		// [
		// 	{
		// 		role: "assistant",
		// 		content: nodeData.text,
		// 	},
		// 	{
		// 		role: "user",
		// 		content: question,
		// 	},
		// ],
		// nodeData.width
	}
};

export const handleCallGPT_Questions = async (
	app: App,
	settings: AugmentedCanvasSettings,
	node: CanvasNode
) => {
	const { buildMessages } = noteGenerator(app, settings);
	const { messages, tokenCount } = await buildMessages(node);
	if (!messages.length) return;

	const messages2 = [
		{
			role: "system",
			content: SYSTEM_PROMPT_QUESTIONS,
		},
		...messages,
		{
			role: "user",
			content: node.text,
		},
	];

	const gptResponse = await getResponse(
		settings.apiKey,
		// settings.apiModel,
		messages2,
		{
			model: settings.apiModel,
		}
		// {
		// 	max_tokens: settings.maxResponseTokens || undefined,
		// 	temperature: settings.temperature,
		// }
	);

	return gptResponse.questions;
};
