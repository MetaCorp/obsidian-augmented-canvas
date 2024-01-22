import { CanvasNode } from "src/obsidian/canvas-internal";

export type HasId = {
	id: string;
};

export type NodeVisitor = (
	node: HasId,
	depth: number,
	edgeLabel?: string
) => Promise<boolean>;

/**
 * Get parents for canvas node
 */
export function nodeParents(node: CanvasNode) {
	const canvas = node.canvas;
	const nodes = canvas
		.getEdgesForNode(node)
		.filter((edge) => edge.to.node.id === node.id)
		.map((edge) => ({
			node: edge.from.node,
			// @ts-expect-error
			edgeLabel: edge.label,
		}));
	// Left-to-right for node ordering
	nodes.sort((a, b) => b.node.x - a.node.x);
	return nodes;
}

/**
 * Visit node and ancestors breadth-first
 */
export async function visitNodeAndAncestors(
	start: { id: string },
	visitor: NodeVisitor,
	getNodeParents: (
		node: HasId
	) => { node: HasId; edgeLabel: string }[] = nodeParents
) {
	const visited = new Set<string>();
	const queue: { node: HasId; depth: number; edgeLabel?: string }[] = [
		{ node: start, depth: 0, edgeLabel: undefined },
	];

	while (queue.length > 0) {
		const { node: currentNode, depth, edgeLabel } = queue.shift()!;
		if (visited.has(currentNode.id)) {
			continue;
		}

		const shouldContinue = await visitor(currentNode, depth, edgeLabel);
		if (!shouldContinue) {
			break;
		}

		visited.add(currentNode.id);

		const parents = getNodeParents(currentNode);
		for (const parent of parents) {
			if (!visited.has(parent.node.id)) {
				queue.push({
					node: parent.node,
					depth: depth + 1,
					edgeLabel: parent.edgeLabel,
				});
			}
		}
	}
}
