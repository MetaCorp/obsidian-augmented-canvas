// import { TiktokenModel, encodingForModel } from "js-tiktoken";
import { App, ItemView, Notice } from "obsidian";
import { CanvasNode } from "./obsidian/canvas-internal";
import { CanvasView, calcHeight, createNode } from "./obsidian/canvas-patches";
// import {
// 	ChatStreamSettings,
// 	DEFAULT_SETTINGS,
// } from "./settings/ChatStreamSettings";
// import { Logger } from "./util/logging";
import { visitNodeAndAncestors } from "./obsidian/canvasUtil";
import { readNodeContent } from "./obsidian/fileUtil";
import { getResponse } from "./chatgpt";

/**
 * Color for assistant notes: 6 == purple
 */
const assistantColor = "6";

/**
 * Height to use for placeholder note
 */
const placeholderNoteHeight = 60;

/**
 * Height to use for new empty note
 */
const emptyNoteHeight = 100;

const NOTE_MAX_WIDTH = 400;

// TODO : remove
const logDebug = console.log;

const SYSTEM_PROMPT = `You must respond in this JSON format: {
	"response": Your response,
	"questions": Follow up questions the user could ask based on your response, must be an array
}`;

export function noteGenerator(
	app: App
	// settings: ChatStreamSettings,
	// logDebug: Logger
) {
	// TODO
	const canCallAI = () => {
		return true;
		// if (!settings.apiKey) {
		// 	new Notice("Please set your OpenAI API key in the plugin settings");
		// 	return false;
		// }

		// return true;
	};

	const generateGptNote = async (prompt: string, parentNodeWidth: number) => {
		logDebug("Creating user note");

		const canvas = getActiveCanvas();
		if (!canvas) {
			logDebug("No active canvas");
			return;
		}

		await canvas.requestFrame();

		const selection = canvas.selection;
		if (selection?.size !== 1) return;
		const values = Array.from(selection.values()) as CanvasNode[];
		const node = values[0];

		if (!node) return;

		const created = createNode(canvas, node, {
			text: "loading...",
			size: {
				height: emptyNoteHeight,
				// width: Math.min(parentNodeWidth, NOTE_MAX_WIDTH),
				width: parentNodeWidth,
			},
		});
		canvas.selectOnly(created, true /* startEditing */);

		// startEditing() doesn't work if called immediately
		await canvas.requestSave();

		// await sleep(100);
		// created.startEditing();

		const gptResponse = await getResponse("", [
			{
				role: "system",
				content: SYSTEM_PROMPT,
			},
			{
				role: "user",
				content: prompt,
			},
		]);

		created.setText(gptResponse.response);
		created.setData({
			questions: gptResponse.questions,
		});
		console.log({ created });
		await canvas.requestSave();
	};

	const getActiveCanvas = () => {
		const maybeCanvasView = app.workspace.getActiveViewOfType(
			ItemView
		) as CanvasView | null;
		return maybeCanvasView ? maybeCanvasView["canvas"] : null;
	};

	const isSystemPromptNode = (text: string) =>
		text.trim().startsWith("SYSTEM PROMPT");

	const getSystemPrompt = async (node: CanvasNode) => {
		return undefined;
		// TODO
		// let foundPrompt: string | null = null;

		// await visitNodeAndAncestors(node, async (n: CanvasNode) => {
		// 	const text = await readNodeContent(n);
		// 	if (text && isSystemPromptNode(text)) {
		// 		foundPrompt = text;
		// 		return false;
		// 	} else {
		// 		return true;
		// 	}
		// });

		// return foundPrompt || settings.systemPrompt;
	};

	const buildMessages = async (node: CanvasNode) => {
		return { messages: [], tokenCount: 0 };

		// TODO
		// const encoding = encodingForModel(
		// 	(settings.apiModel || DEFAULT_SETTINGS.apiModel) as TiktokenModel
		// );

		// const messages: openai.ChatCompletionRequestMessage[] = [];
		// let tokenCount = 0;

		// // Note: We are not checking for system prompt longer than context window.
		// // That scenario makes no sense, though.
		// const systemPrompt = await getSystemPrompt(node);
		// if (systemPrompt) {
		// 	tokenCount += encoding.encode(systemPrompt).length;
		// }

		// const visit = async (node: CanvasNode, depth: number) => {
		// 	if (settings.maxDepth && depth > settings.maxDepth) return false;

		// 	const nodeData = node.getData();
		// 	let nodeText = (await readNodeContent(node))?.trim() || "";
		// 	const inputLimit = getTokenLimit(settings);

		// 	let shouldContinue = true;

		// 	if (nodeText) {
		// 		if (isSystemPromptNode(nodeText)) return true;

		// 		let nodeTokens = encoding.encode(nodeText);
		// 		let keptNodeTokens: number;

		// 		if (tokenCount + nodeTokens.length > inputLimit) {
		// 			// will exceed input limit

		// 			shouldContinue = false;

		// 			// Leaving one token margin, just in case
		// 			const keepTokens = nodeTokens.slice(
		// 				0,
		// 				inputLimit - tokenCount - 1
		// 			);
		// 			const truncateTextTo = encoding.decode(keepTokens).length;
		// 			logDebug(
		// 				`Truncating node text from ${nodeText.length} to ${truncateTextTo} characters`
		// 			);
		// 			nodeText = nodeText.slice(0, truncateTextTo);
		// 			keptNodeTokens = keepTokens.length;
		// 		} else {
		// 			keptNodeTokens = nodeTokens.length;
		// 		}

		// 		tokenCount += keptNodeTokens;

		// 		const role: openai.ChatCompletionRequestMessageRoleEnum =
		// 			nodeData.chat_role === "assistant" ? "assistant" : "user";

		// 		messages.unshift({
		// 			content: nodeText,
		// 			role,
		// 		});
		// 	}

		// 	return shouldContinue;
		// };

		// await visitNodeAndAncestors(node, visit);

		// if (messages.length) {
		// 	if (systemPrompt) {
		// 		messages.unshift({
		// 			content: systemPrompt,
		// 			role: "system",
		// 		});
		// 	}

		// 	return { messages, tokenCount };
		// } else {
		// 	return { messages: [], tokenCount: 0 };
		// }
	};

	// const generateNote = async () => {
	// 	if (!canCallAI()) return;

	// 	logDebug("Creating AI note");

	// 	const canvas = getActiveCanvas();
	// 	if (!canvas) {
	// 		logDebug("No active canvas");
	// 		return;
	// 	}

	// 	await canvas.requestFrame();

	// 	const selection = canvas.selection;
	// 	if (selection?.size !== 1) return;
	// 	const values = Array.from(selection.values());
	// 	const node = values[0];

	// 	if (node) {
	// 		// Last typed characters might not be applied to note yet
	// 		await canvas.requestSave();
	// 		await sleep(200);

	// 		const { messages, tokenCount } = await buildMessages(node);
	// 		if (!messages.length) return;

	// 		const created = createNode(
	// 			canvas,
	// 			node,
	// 			{
	// 				text: `Calling AI (${settings.apiModel})...`,
	// 				size: { height: placeholderNoteHeight },
	// 			},
	// 			{
	// 				color: assistantColor,
	// 				chat_role: "assistant",
	// 			}
	// 		);

	// 		new Notice(
	// 			`Sending ${messages.length} notes with ${tokenCount} tokens to GPT`
	// 		);

	// 		try {
	// 			logDebug("messages", messages);

	// 			const generated = await getChatGPTCompletion(
	// 				settings.apiKey,
	// 				settings.apiUrl,
	// 				settings.apiModel,
	// 				messages,
	// 				{
	// 					max_tokens: settings.maxResponseTokens || undefined,
	// 					temperature: settings.temperature,
	// 				}
	// 			);

	// 			if (generated == null) {
	// 				new Notice(`Empty or unreadable response from GPT`);
	// 				canvas.removeNode(created);
	// 				return;
	// 			}

	// 			created.setText(generated);
	// 			const height = calcHeight({
	// 				text: generated,
	// 				parentHeight: node.height,
	// 			});
	// 			created.moveAndResize({
	// 				height,
	// 				width: created.width,
	// 				x: created.x,
	// 				y: created.y,
	// 			});

	// 			const selectedNoteId =
	// 				canvas.selection?.size === 1
	// 					? Array.from(canvas.selection.values())?.[0]?.id
	// 					: undefined;

	// 			if (selectedNoteId === node?.id || selectedNoteId == null) {
	// 				// If the user has not changed selection, select the created node
	// 				canvas.selectOnly(created, false /* startEditing */);
	// 			}
	// 		} catch (error) {
	// 			new Notice(`Error calling GPT: ${error.message || error}`);
	// 			canvas.removeNode(created);
	// 		}

	// 		await canvas.requestSave();
	// 	}
	// };

	// return { nextNote, generateNote };
	return { generateGptNote };
}

// function getTokenLimit(settings: ChatStreamSettings) {
// 	const model = chatModelByName(settings.apiModel) || CHAT_MODELS.GPT35;
// 	return settings.maxInputTokens
// 		? Math.min(settings.maxInputTokens, model.tokenLimit)
// 		: model.tokenLimit;
// }
