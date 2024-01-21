import { CanvasNode, Component } from "obsidian";
import { CanvasNodeType } from "./canvas";

interface HeaderComponent extends Component {
    checkNodeType(): CanvasNodeType;

    initHeader(): void;

    initContent(): void;

    initTypeIcon(): void;

    setIconOrContent(action: string): void;

    setCollapsed(collapsed: boolean): void;

    toggleCollapsed(): Promise<void>;

    refreshHistory(): void;

    updateNode(): void;

    updateNodesInGroup(): void;

    updateEdges(): void;

    updateEdgesInGroup(node: CanvasNode, triggerCollapsed?: boolean): void;
}
