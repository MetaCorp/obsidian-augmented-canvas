import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

export type Message = {
	role: string;
	content: string;
};

export const streamResponse = async (
	apiKey: string,
	// prompt: string,
	messages: ChatCompletionMessageParam[],
	{
		maxTokens,
		model,
		isJSON = true,
	}: { maxTokens?: number; model?: string; isJSON?: boolean } = {},
	cb: any
) => {
	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	const stream = await openai.chat.completions.create({
		model: "gpt-4",
		messages,
		stream: true,
	});
	for await (const chunk of stream) {
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
		maxTokens,
		model,
		isJSON = true,
	}: { maxTokens?: number; model?: string; isJSON?: boolean } = {}
) => {
	// console.log("Calling ChatGPT getResponse: ", {
	// 	messages,
	// 	// prompt,
	// 	// apiKey,
	// 	maxTokens,
	// 	model,
	// });

	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	const openaiMessages = [
		...messages,
		// {
		//   role: 'user',
		//   content: prompt,
		// },
	];

	const totalTokens =
		openaiMessages.reduce(
			(total, message) => total + (message.content?.length || 0),
			0
		) * 2;
	// console.log({ totalTokens });

	const completion = await openai.chat.completions.create({
		// model: "gpt-3.5-turbo",
		model: model || "gpt-4-1106-preview",
		messages: openaiMessages,
		// max_tokens: 2048 || maxTokens || 4096 - totalTokens,
		response_format: { type: isJSON ? "json_object" : "text" },
	});

	// console.log({ completion });
	return JSON.parse(completion.choices[0].message!.content!);
};

let count = 0;
export const createImage = async (
	apiKey: string,
	prompt: string,
	isVertical: boolean = false
) => {
	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	count++;
	// console.log({ createImage: { prompt, count } });
	const response = await openai.images.generate({
		model: "dall-e-3",
		prompt,
		n: 1,
		size: isVertical ? "1024x1792" : "1792x1024",
		response_format: "b64_json",
	});
	// console.log({ responseImg: response });
	return response.data[0].b64_json!;
};
