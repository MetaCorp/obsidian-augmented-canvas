import { FuseIndex } from "fuse.js";
import { CHAT_MODELS } from "src/openai/models";

export interface SystemPrompt {
	id: number;
	act: string;
	prompt: string;
}

export interface AugmentedCanvasSettings {
	/**
	 * The API key to use when making requests
	 */
	apiKey: string;

	/**
	 * The GPT model to use
	 */
	apiModel: string;

	/**
	 * The temperature to use when generating responses (0-2). 0 means no randomness.
	 */
	temperature: number;

	/**
	 * The system prompt sent with each request to the API
	 */
	systemPrompt: string;

	/**
	 * Enable debug output in the console
	 */
	debug: boolean;

	/**
	 * The maximum number of tokens to send (up to model limit). 0 means as many as possible.
	 */
	maxInputTokens: number;

	/**
	 * The maximum number of tokens to return from the API. 0 means no limit. (A token is about 4 characters).
	 */
	maxResponseTokens: number;

	/**
	 * The maximum depth of ancestor notes to include. 0 means no limit.
	 */
	maxDepth: number;

	/**
	 * System prompt list fetch from github
	 */
	systemPrompts: SystemPrompt[];

	/**
	 * User system prompts
	 */
	userSystemPrompts: SystemPrompt[];

	/**
	 * System prompt used to generate flashcards file
	 */
	flashcardsSystemPrompt: string;
}

// export const DEFAULT_SYSTEM_PROMPT = `
// You are a critical-thinking assistant bot.
// Consider the intent of my questions before responding.
// Do not restate my information unless I ask for it.
// Do not include caveats or disclaimers.
// Use step-by-step reasoning. Be brief.
// `.trim();

const DEFAULT_SYSTEM_PROMPT = `
You must respond in markdown.
The response must be in the same language the user used.
`.trim();

const FLASHCARDS_SYSTEM_PROMPT = `
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

export const DEFAULT_SETTINGS: AugmentedCanvasSettings = {
	apiKey: "",
	apiModel: CHAT_MODELS.GPT_4_1106_PREVIEW.name,
	temperature: 1,
	systemPrompt: DEFAULT_SYSTEM_PROMPT,
	debug: false,
	maxInputTokens: 0,
	maxResponseTokens: 0,
	maxDepth: 0,
	systemPrompts: [],
	userSystemPrompts: [],
	flashcardsSystemPrompt: FLASHCARDS_SYSTEM_PROMPT,
};

export function getModels() {
	return Object.entries(CHAT_MODELS).map(([, value]) => value.name);
}
