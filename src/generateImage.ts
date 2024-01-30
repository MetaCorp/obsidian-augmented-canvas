import { App, Notice } from "obsidian";
import { AugmentedCanvasSettings } from "./settings/AugmentedCanvasSettings";
import { createImage } from "./chatgpt";
import {
	getActiveCanvas,
	getActiveCanvasNodes,
	getCanvasActiveNoteText,
	getImageSaveFolderPath,
} from "./utils";
import { saveBase64Image } from "./obsidian/imageUtils";
import { createNode } from "./obsidian/canvas-patches";
import { updateNodeAndSave } from "./obsidian/fileUtil";

export const handleGenerateImage = async (
	app: App,
	settings: AugmentedCanvasSettings
) => {
	new Notice(`Generating image using ${settings.imageModel}...`);

	const canvas = getActiveCanvas(app);
	if (!canvas) return;

	const activeCanvasNodes = getActiveCanvasNodes(app);
	if (!activeCanvasNodes || activeCanvasNodes.length !== 1) return;

	const parentNode = activeCanvasNodes[0];

	// TODO : create node with "loading image", then get that node, add pass it to addImageToCanvas
	// TODO : update create node to add a non-parent node and to place it in the center of the canvas
	const nodeText = await getCanvasActiveNoteText(app);
	if (!nodeText) return;

	const node = createNode(
		canvas,
		{
			text: `\`Calling AI (${settings.imageModel})...\``,
		},
		parentNode
	);

	const b64Image = await createImage(settings.apiKey, nodeText, {
		model: settings.imageModel,
	});

	// TODO
	const imageFileName = "Test Image";
	await saveBase64Image(app, settings, imageFileName, b64Image);
	new Notice(`Generating image "${imageFileName}" done successfully.`);

	updateNodeAndSave(canvas, node, { text: `![[${imageFileName}.png]]` });
};
