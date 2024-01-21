import { App, CanvasNode } from "obsidian";
import { noteGenerator } from "./noteGenerator";

const NODE_HEIGHT = 500;

export const handleCallGPT = async (app: App, node: CanvasNode) => {
	if (node.unknownData.type === "group") {
		// (node.headerComponent as CollapseControlHeader).updateNodesInGroup();
		return;
	}
	const canvasData = node.canvas.getData();
	const nodeData = canvasData.nodes.find((t: any) => t.id === node.id);

	// TODO : CallGPT and update text
	if (nodeData) {
		const { generateGptNote } = noteGenerator(app);

		// console.log({ nodeData });
		// 		nodeData.text = `# ${nodeData.text}

		// ${gptResponse}`;

		// nodeData.gptQuestions = ["Question 1", "Question 2", "Question 3"];

		// nodeData.height =
		// 	nodeData.height > NODE_HEIGHT ? nodeData.height : NODE_HEIGHT;
		await generateGptNote(nodeData.text, nodeData.width);
	}

	// node.canvas.setData(canvasData);
	// node.canvas.requestSave(true, true);

	// updateSelection(node.canvas);
};

export const handleCallGPT_Question = async (
	app: App,
	node: CanvasNode,
	question: string
) => {
	if (node.unknownData.type === "group") {
		return;
	}
	const canvasData = node.canvas.getData();
	const nodeData = canvasData.nodes.find((t: any) => t.id === node.id);

	// TODO : CallGPT and update text
	if (nodeData) {
		const { generateGptNote } = noteGenerator(app);
		await generateGptNote(nodeData.text, nodeData.width);
	}
};
