import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { logDebug } from "src/logDebug";

export type Message = {
	role: string;
	content: string;
};

export const streamResponse = async (
	apiKey: string,
	// prompt: string,
	messages: ChatCompletionMessageParam[],
	{
		max_tokens,
		model,
		temperature,
	}: {
		max_tokens?: number;
		model?: string;
		temperature?: number;
	} = {},
	cb: any
) => {
	logDebug("Calling AI :", {
		messages,
		model,
		max_tokens,
		temperature,
		isJSON: false,
	});
	// console.log({ messages, max_tokens });
	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	const stream = await openai.chat.completions.create({
		model: model || "gpt-4",
		messages,
		stream: true,
		max_tokens,
		temperature,
	});
	for await (const chunk of stream) {
		logDebug("AI chunk", { chunk });
		// console.log({ completionChoice: chunk.choices[0] });
		cb(chunk.choices[0]?.delta?.content || "");
	}
	cb(null);
};

export const getResponse = async (
	apiKey: string,
	// prompt: string,
	messages: ChatCompletionMessageParam[],
	{
		model,
		max_tokens,
		temperature,
		isJSON,
	}: {
		model?: string;
		max_tokens?: number;
		temperature?: number;
		isJSON?: boolean;
	} = {}
) => {
	logDebug("Calling AI :", {
		messages,
		model,
		max_tokens,
		temperature,
		isJSON,
	});

	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	// const totalTokens =
	// 	openaiMessages.reduce(
	// 		(total, message) => total + (message.content?.length || 0),
	// 		0
	// 	) * 2;
	// console.log({ totalTokens });

	const completion = await openai.chat.completions.create({
		// model: "gpt-3.5-turbo",
		model: model || "gpt-4-1106-preview",
		messages,
		max_tokens,
		temperature,
		response_format: { type: isJSON ? "json_object" : "text" },
	});

	logDebug("AI response", { completion });
	return isJSON
		? JSON.parse(completion.choices[0].message!.content!)
		: completion.choices[0].message!.content!;
};

let count = 0;
export const createImage = async (
	apiKey: string,
	prompt: string,
	{
		isVertical = false,
		model,
	}: {
		isVertical?: boolean;
		model?: string;
	}
) => {
	logDebug("Calling AI :", {
		prompt,
		model,
	});
	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	count++;
	// console.log({ createImage: { prompt, count } });
	const response = await openai.images.generate({
		model: model || "dall-e-3",
		prompt,
		n: 1,
		size: isVertical ? "1024x1792" : "1792x1024",
		response_format: "b64_json",
	});
	logDebug("AI response", { response });
	// console.log({ responseImg: response });
	return response.data[0].b64_json!;
};
