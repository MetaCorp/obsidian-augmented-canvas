import { App } from "obsidian";
import { AugmentedCanvasSettings } from "src/settings/AugmentedCanvasSettings";

const writeImageToFile = async (
	app: App,
	settings: AugmentedCanvasSettings,
	imageBuffer: ArrayBuffer,
	imageName: string
): Promise<void> => {
	try {
		const fileAdapter = app.vault.adapter; // Get the current file adapter
		// TODO : bind to settings attachments path or fallback to settings.imagePath
		const imagePath: string = `/${imageName}.png`; // The path where the image will be saved

		// Write the array buffer to the vault
		await fileAdapter.writeBinary(imagePath, new Uint8Array(imageBuffer));
		console.log("Image saved successfully.");
	} catch (error) {
		console.error("Error saving the image:", error);
	}
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
	const binaryString: string = window.atob(base64);
	const len: number = binaryString.length;
	const bytes: Uint8Array = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
};

export const saveBase64Image = async (
	app: App,
	settings: AugmentedCanvasSettings,
	imageName: string,
	base64Image: string
): Promise<void> => {
	// Remove 'data:image/png;base64,' if present
	const base64Data: string = base64Image.split(",")[1] || base64Image;

	// Convert base64 to array buffer
	const imageBuffer: ArrayBuffer = base64ToArrayBuffer(base64Data);

	// Save to file
	await writeImageToFile(app, settings, imageBuffer, imageName);
};
