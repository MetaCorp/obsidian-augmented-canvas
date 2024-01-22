export const CHAT_MODELS = {
	// GPT35: {
	// 	name: "gpt-3.5-turbo",
	// 	tokenLimit: 4096,
	// },
	// GPT35_16K: {
	// 	name: "gpt-3.5-turbo-16k",
	// 	tokenLimit: 16384,
	// },
	// GPT4: {
	// 	name: "gpt-4",
	// 	tokenLimit: 8000,
	// },
	GPT_4_1106_PREVIEW: {
		name: "gpt-4-1106-preview",
		tokenLimit: 128000,
	},
	// GPT4_32K: {
	// 	name: "gpt-4-32k",
	// 	tokenLimit: 32768,
	// },
};

export function chatModelByName(name: string) {
	return Object.values(CHAT_MODELS).find((model) => model.name === name);
}
