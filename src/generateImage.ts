import { App, Notice } from "obsidian";
import { AugmentedCanvasSettings } from "./settings/AugmentedCanvasSettings";
import { createImage } from "./chatgpt";
import {
	addImageToCanvas,
	getCanvasActiveNoteText,
	getImageSaveFolderPath,
} from "./utils";
import { saveBase64Image } from "./obsidian/imageUtils";

export const handleGenerateImage = async (
	app: App,
	settings: AugmentedCanvasSettings
) => {
	new Notice(`Generating image using ${settings.imageModel}...`);
	const nodeText = await getCanvasActiveNoteText(app);
	if (!nodeText) return;

	const b64Image = await createImage(settings.apiKey, nodeText, {
		model: settings.imageModel,
	});

	const imageFileName = "Test Image";
	await saveBase64Image(
		app,
		settings,
		// TODO
		imageFileName,
		b64Image
	);
	new Notice(`Generating image "${imageFileName}" done successfully.`);

	// TODO
	await addImageToCanvas(
		app,
		`${imageFileName}.png`
		// `${getImageSaveFolderPath(settings)}${imageFileName}.png`
	);
};
