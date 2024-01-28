import { App, TFile, loadPdfJs, resolveSubpath } from "obsidian";
import { CanvasNode } from "./canvas-internal";

export async function readFileContent(
	app: App,
	file: TFile,
	subpath?: string | undefined
) {
	const body = await app.vault.read(file);

	if (subpath) {
		const cache = app.metadataCache.getFileCache(file);
		if (cache) {
			const resolved = resolveSubpath(cache, subpath);
			if (!resolved) {
				console.warn("Failed to get subpath", { file, subpath });
				return body;
			}
			if (resolved.start || resolved.end) {
				const subText = body.slice(
					resolved.start.offset,
					resolved.end?.offset
				);
				if (subText) {
					return subText;
				} else {
					console.warn("Failed to get subpath", { file, subpath });
					return body;
				}
			}
		}
	}

	return body;
}

const pdfToMarkdown = async (app: App, file: TFile) => {
	const pdfjsLib = await loadPdfJs();

	const pdfBuffer = await app.vault.readBinary(file);
	const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
	const pdf = await loadingTask.promise;

	let markdownContent = "";

	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
		const page = await pdf.getPage(pageNum);
		const textContent = await page.getTextContent();

		let pageText = textContent.items
			.map((item: { str: string }) => item.str)
			.join(" ");

		// Here you would need to enhance the logic to convert the text into Markdown.
		// For example, you could detect headers, lists, tables, etc., and apply the appropriate Markdown formatting.
		// This can get quite complex depending on the structure and layout of the original PDF.

		// Add a page break after each page's content.
		markdownContent += pageText + "\n\n---\n\n";
	}

	return markdownContent;
};

const readDifferentExtensionFileContent = async (app: App, file: TFile) => {
	switch (file.extension) {
		case "md":
			const body = await app.vault.cachedRead(file);
			return `## ${file.basename}\n${body}`;

		case "pdf":
			return pdfToMarkdown(app, file);

		default:
			break;
	}
};

export async function readNodeContent(node: CanvasNode) {
	const app = node.app;
	const nodeData = node.getData();
	switch (nodeData.type) {
		case "text":
			return nodeData.text;
		case "file":
			const file = app.vault.getAbstractFileByPath(nodeData.file);
			if (file instanceof TFile) {
				if (node.subpath) {
					return await readFileContent(app, file, nodeData.subpath);
				} else {
					return readDifferentExtensionFileContent(app, file);
				}
			} else {
				console.debug("Cannot read from file type", file);
			}
	}
}
