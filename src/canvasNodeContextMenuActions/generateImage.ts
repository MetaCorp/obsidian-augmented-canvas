import { App, Notice, TFile } from "obsidian";
import { AugmentedCanvasSettings } from "../settings/AugmentedCanvasSettings";
import { createImage } from "../utils/chatgpt";
import {
	getActiveCanvas,
	getActiveCanvasNodes,
	getCanvasActiveNoteText,
	getImageSaveFolderPath,
} from "../utils";
import { saveBase64Image } from "../obsidian/imageUtils";
import { createNode } from "../obsidian/canvas-patches";
import { generateFileName, updateNodeAndSave } from "../obsidian/fileUtil";

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

	const nodeText = await getCanvasActiveNoteText(app);
	if (!nodeText) return;

	const IMAGE_WIDTH = parentNode.width;
	const IMAGE_HEIGHT = IMAGE_WIDTH * (1024 / 1792) + 20;

	const node = createNode(
		canvas,
		{
			text: `\`Calling AI (${settings.imageModel})...\``,
			size: {
				width: IMAGE_WIDTH,
				height: IMAGE_HEIGHT,
			},
		},
		parentNode
	);

	const b64Image = await createImage(settings.apiKey, nodeText, {
		model: settings.imageModel,
	});

	const imageFileName = generateFileName("AI-Image");
	const imageFolder = getImageSaveFolderPath(app, settings);
	await saveBase64Image(app, `${imageFolder}${imageFileName}.png`, b64Image);
	new Notice(`Generating image "${imageFileName}" done successfully.`);

	updateNodeAndSave(canvas, node, {
		text: `![[${imageFileName}.png]]`,
	});

	// TODO : For now Obsidian API to .createFileNode is bugged
	// canvas.removeNode(node);

	// await sleep(100);

	// const file = app.vault.getAbstractFileByPath(
	// 	`${imageFileName}.png`
	// ) as TFile;
	// console.log({ file });

	// const node2 = createNode(
	// 	canvas,
	// 	{
	// 		type: "file",
	// 		file,
	// 		size: {
	// 			width: IMAGE_WIDTH,
	// 			height: IMAGE_HEIGHT,
	// 		},
	// 	},
	// 	parentNode
	// );
	// node2.moveAndResize({
	// 	size: {
	// 		width: IMAGE_WIDTH,
	// 		height: IMAGE_HEIGHT,
	// 	},
	// });

	canvas.requestSave();
};
